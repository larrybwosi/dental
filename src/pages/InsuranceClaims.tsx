import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  CreditCard,
  Plus,
  Trash2,
  Save,
  Split,
  ArrowLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { dataManager, Payment, InsuranceProvider } from "@/lib/dataManager";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface InsuranceMetadata {
  claimId?: string;
  approvalCode?: string;
  transactionRef?: string;
  extraFields?: { key: string; value: string }[];
}

const InsuranceClaims = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [insuranceProviders, setInsuranceProviders] = useState<InsuranceProvider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Edit form state
  const [metadata, setMetadata] = useState<InsuranceMetadata>({});
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<"pending" | "paid">("pending");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allPayments, providers] = await Promise.all([
        dataManager.getPayments(),
        dataManager.getInsuranceProviders(),
      ]);
      setPayments(allPayments.filter((p) => p.method === "insurance"));
      setInsuranceProviders(providers);
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error("Failed to load insurance claims");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setAmount(payment.amount);
    setStatus(payment.status as "pending" | "paid");
    setNotes(payment.notes || "");

    try {
      const parsedMetadata = payment.metadata ? JSON.parse(payment.metadata) : {};
      setMetadata({
        claimId: parsedMetadata.claimId || "",
        approvalCode: parsedMetadata.approvalCode || "",
        transactionRef: parsedMetadata.transactionRef || "",
        extraFields: parsedMetadata.extraFields || [],
      });
    } catch {
      setMetadata({ extraFields: [] });
    }

    setIsEditDialogOpen(true);
  };

  const handleAddExtraField = () => {
    setMetadata((prev) => ({
      ...prev,
      extraFields: [...(prev.extraFields || []), { key: "", value: "" }],
    }));
  };

  const handleExtraFieldChange = (index: number, field: "key" | "value", value: string) => {
    const newFields = [...(metadata.extraFields || [])];
    newFields[index][field] = value;
    setMetadata((prev) => ({ ...prev, extraFields: newFields }));
  };

  const handleRemoveExtraField = (index: number) => {
    const newFields = [...(metadata.extraFields || [])];
    newFields.splice(index, 1);
    setMetadata((prev) => ({ ...prev, extraFields: newFields }));
  };

  const handleSave = async () => {
    if (!selectedPayment) return;

    try {
      await dataManager.updatePayment(selectedPayment.id, {
        amount,
        status,
        notes,
        metadata: JSON.stringify(metadata),
      });
      toast.success("Claim updated successfully");
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to update claim");
    }
  };

  const handleSplitPayment = async () => {
    if (!selectedPayment) return;

    const paidAmount = prompt("Enter the amount paid by insurance:", amount.toString());
    if (paidAmount === null) return;

    const paid = parseFloat(paidAmount);
    if (isNaN(paid) || paid <= 0 || paid >= amount) {
      toast.error("Invalid amount for splitting. Must be less than the total.");
      return;
    }

    const remaining = amount - paid;

    try {
      // 1. Update current payment with the paid amount and mark as paid
      await dataManager.updatePayment(selectedPayment.id, {
        amount: paid,
        status: "paid",
        metadata: JSON.stringify(metadata),
        notes: `${notes} (Insurance part-payment)`.trim(),
      });

      // 2. Create a new pending payment for the remaining balance (as cash)
      await dataManager.addPayment({
        patient_id: selectedPayment.patient_id,
        patient_name: selectedPayment.patient_name,
        treatment_id: selectedPayment.treatment_id,
        amount: remaining,
        date: selectedPayment.date,
        method: "cash",
        status: "pending",
        notes: `Balance from insurance claim ${metadata.claimId || ""}`.trim(),
      });

      toast.success("Payment split successfully. Balance moved to cash/pending.");
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to split payment");
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reception")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Insurance Claims</h1>
            <p className="text-sm text-gray-500">Manage insurance billing and provider approvals</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by patient or notes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200">
          {["all", "pending", "paid"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all",
                filterStatus === status
                  ? "bg-white text-[#0078d4] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="py-20 text-center text-gray-500">Loading claims...</div>
        ) : filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => {
            const meta = payment.metadata ? JSON.parse(payment.metadata) : {};
            return (
              <Card
                key={payment.id}
                className="hover:border-[#0078d4] transition-colors cursor-pointer group"
                onClick={() => handleEditClick(payment)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <CreditCard className="h-6 w-6 text-[#0078d4]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{payment.patient_name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{payment.date}</span>
                        <span>•</span>
                        <span>{insuranceProviders.find(p => p.id === payment.insurance_provider_id)?.name || "Insurance"}</span>
                      </div>
                      {meta.claimId && (
                        <p className="text-[10px] font-mono text-[#0078d4] mt-1 uppercase">Claim: {meta.claimId}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-lg font-black text-gray-900">Fee {payment.amount.toLocaleString()}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase text-[10px] font-bold rounded-sm px-2",
                          payment.status === "paid"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#0078d4] transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="py-20 text-center bg-white border border-dashed rounded-lg">
            <Info className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No insurance claims found matching your criteria.</p>
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Insurance Claim</DialogTitle>
            <DialogDescription>
              Update insurance approval details for {selectedPayment?.patient_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billed Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">Provider Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Claim ID</Label>
                  <Input
                    value={metadata.claimId}
                    onChange={(e) => setMetadata({ ...metadata, claimId: e.target.value })}
                    placeholder="Enter Claim #"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Approval Code</Label>
                  <Input
                    value={metadata.approvalCode}
                    onChange={(e) => setMetadata({ ...metadata, approvalCode: e.target.value })}
                    placeholder="Enter Code"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Transaction Ref</Label>
                  <Input
                    value={metadata.transactionRef}
                    onChange={(e) => setMetadata({ ...metadata, transactionRef: e.target.value })}
                    placeholder="Ref #"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">Extra Fields</h4>
                <Button variant="outline" size="sm" onClick={handleAddExtraField}>
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {metadata.extraFields?.map((field, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Key</Label>
                      <Input
                        value={field.key}
                        onChange={(e) => handleExtraFieldChange(index, "key", e.target.value)}
                        placeholder="e.g. Policy #"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px]">Value</Label>
                      <Input
                        value={field.value}
                        onChange={(e) => handleExtraFieldChange(index, "value", e.target.value)}
                        placeholder="Value"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleRemoveExtraField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional comments..."
              />
            </div>

            <div className="flex items-center justify-between gap-4 pt-4">
              <Button
                variant="outline"
                className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                onClick={handleSplitPayment}
              >
                <Split className="h-4 w-4 mr-2" /> Split / Partial Payment
              </Button>
              <Button className="flex-1 bg-[#0078d4] text-white" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsuranceClaims;
