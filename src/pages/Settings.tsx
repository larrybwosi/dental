import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { dataManager } from "@/lib/dataManager";
import { Save, Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const [receptionFee, setReceptionFee] = useState<string>("0");
  const [requirePaymentBeforeAdmit, setRequirePaymentBeforeAdmit] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [fee, requirePay] = await Promise.all([
        dataManager.getSetting("reception_fee"),
        dataManager.getSetting("require_payment_before_admit")
      ]);
      setReceptionFee(fee || "0");
      setRequirePaymentBeforeAdmit(requirePay === "true");
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        dataManager.setSetting("reception_fee", receptionFee),
        dataManager.setSetting("require_payment_before_admit", requirePaymentBeforeAdmit.toString())
      ]);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-blue-600" />
          Application Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure clinic rules and fees</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>Manage consultation fees and payment rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="receptionFee">Standard Reception Fee ($)</Label>
            <Input
              type="number"
              id="receptionFee"
              value={receptionFee}
              onChange={(e) => setReceptionFee(e.target.value)}
              placeholder="50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="requirePayment"
              checked={requirePaymentBeforeAdmit}
              onChange={(e) => setRequirePaymentBeforeAdmit(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <Label htmlFor="requirePayment">Require payment/waiver before admitting patient</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
