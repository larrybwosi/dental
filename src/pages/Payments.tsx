import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { dataManager, Payment, Patient, Treatment } from "@/lib/dataManager";
import { toast } from "sonner";

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: "",
    treatmentId: "",
    amount: 0,
    method: "card" as const,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPayments(dataManager.getPayments());
    setPatients(dataManager.getPatients());
    setTreatments(dataManager.getTreatments());
  };

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === formData.patientId);
    if (!patient) return;

    try {
      dataManager.addPayment({
        patientId: formData.patientId,
        patientName: patient.name,
        treatmentId: formData.treatmentId || undefined,
        amount: formData.amount,
        date: new Date().toISOString(),
        method: formData.method,
        status: "paid",
        notes: formData.notes,
      });
      loadData();
      setShowAddDialog(false);
      resetForm();
      toast.success("Payment recorded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to record payment");
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      treatmentId: "",
      amount: 0,
      method: "card",
      notes: "",
    });
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.notes.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingTreatmentsCount = treatments.filter(t => 
    !payments.some(p => p.treatmentId === t.id)
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Manage patient billing and transaction history</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>Enter payment details for the patient.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select 
                  value={formData.patientId} 
                  onValueChange={(val) => {
                    const patientTreatments = treatments.filter(t => t.patientId === val && !payments.some(p => p.treatmentId === t.id));
                    setFormData({
                      ...formData, 
                      patientId: val,
                      amount: patientTreatments.length > 0 ? patientTreatments[0].cost : 0,
                      treatmentId: patientTreatments.length > 0 ? patientTreatments[0].id : ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.patientId && (
                <div className="space-y-2">
                  <Label htmlFor="treatment">Unpaid Treatment (Optional)</Label>
                  <Select 
                    value={formData.treatmentId} 
                    onValueChange={(val) => {
                      const treatment = treatments.find(t => t.id === val);
                      setFormData({...formData, treatmentId: val, amount: treatment?.cost || 0});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Treatment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Advance Payment</SelectItem>
                      {treatments
                        .filter(t => t.patientId === formData.patientId && !payments.some(p => p.treatmentId === t.id))
                        .map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.treatment} ({formatCurrency(t.cost)})
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select 
                  value={formData.method} 
                  onValueChange={(val: any) => setFormData({...formData, method: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional payment details..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Record Transaction</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-50 to-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-emerald-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Transactions</p>
                <p className="text-3xl font-bold text-blue-900">{payments.length}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-amber-50 to-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Pending Billing</p>
                <p className="text-3xl font-bold text-amber-900">{pendingTreatmentsCount}</p>
              </div>
              <div className="p-3 bg-amber-200 rounded-full">
                <Clock className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search payments by patient name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Patient</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Method</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-900">{payment.patientName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(payment.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="capitalize">
                    {payment.method}
                  </Badge>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Paid
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayments.length === 0 && (
          <div className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payment records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
