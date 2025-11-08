import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Download,
  Upload,
  Database,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  History,
  BarChart3,
  Settings,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { dataManager, BackupEntry } from "@/lib/dataManager";
import { toast } from "sonner";

const DataManagement = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalTreatments: 0,
    storageUsed: "0 KB",
    lastBackup: null as string | null,
  });
  const [backupHistory, setBackupHistory] = useState<BackupEntry[]>([]);
  const [validationResults, setValidationResults] = useState({
    orphanedAppointments: 0,
    orphanedTreatments: 0,
    duplicatePatients: 0,
  });
  const [isValidating, setIsValidating] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    loadStats();
    loadBackupHistory();
    validateData();
  }, []);

  const loadStats = () => {
    const currentStats = dataManager.getStorageStats();
    setStats(currentStats);
  };

  const loadBackupHistory = () => {
    const history = dataManager.getBackupHistory();
    setBackupHistory(history);
  };

  const validateData = async () => {
    setIsValidating(true);
    // Add small delay to show loading state
    setTimeout(() => {
      const results = dataManager.validateData();
      setValidationResults(results);
      setIsValidating(false);
    }, 500);
  };

  const handleExportJSON = () => {
    try {
      dataManager.exportToFile();
      toast.success("Data exported successfully");
      loadStats();
      loadBackupHistory();
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleExportCSV = (
    dataType: "patients" | "appointments" | "treatments"
  ) => {
    try {
      dataManager.exportToCSV(dataType);
      toast.success(`${dataType} data exported to CSV`);
    } catch (error) {
      toast.error(`Failed to export ${dataType} data`);
    }
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await dataManager.importFromFile(file);
      if (result.success) {
        toast.success(result.message);
        loadStats();
        loadBackupHistory();
        validateData();
        setShowImportDialog(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to import file");
    }

    // Reset file input
    event.target.value = "";
  };

  const handleRestoreBackup = (backupId: string) => {
    const result = dataManager.restoreFromBackup(backupId);
    if (result.success) {
      toast.success(result.message);
      loadStats();
      validateData();
    } else {
      toast.error(result.message);
    }
  };

  const handleCleanupData = () => {
    const result = dataManager.cleanupOrphanedData();
    toast.success(`Cleaned up ${result.cleaned} orphaned records`);
    validateData();
    loadStats();
  };

  const handleClearAllData = () => {
    dataManager.clearAllData();
    toast.success("All data cleared successfully");
    loadStats();
    loadBackupHistory();
    validateData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Management</h1>
          <p className="text-gray-600 mt-1">
            Backup, export, and manage your practice data
          </p>
        </div>
      </div>

      {/* Storage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Total Patients
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {stats.totalPatients}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Database className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">
                  Appointments
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {stats.totalAppointments}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <BarChart3 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Treatments
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {stats.totalTreatments}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <FileText className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">
                  Storage Used
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {stats.storageUsed}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <HardDrive className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export & Backup */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Download className="h-6 w-6 mr-3 text-blue-600" />
              Export & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleExportJSON}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Export Complete Database (JSON)
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV("patients")}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Patients CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV("appointments")}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Appointments CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExportCSV("treatments")}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Treatments CSV
                </Button>
              </div>
            </div>

            <Separator />

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="font-medium text-blue-900 mb-1">Last Backup:</div>
              <div className="text-blue-700">
                {stats.lastBackup
                  ? formatDate(stats.lastBackup)
                  : "No backups yet"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import & Restore */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Upload className="h-6 w-6 mr-3 text-green-600" />
              Import & Restore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Database File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Database</DialogTitle>
                  <DialogDescription>
                    Select a JSON backup file to import. This will replace all
                    current data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="import-file">Select Backup File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="mt-2"
                    />
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center text-yellow-800">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Warning</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Importing will replace all current data. A backup will be
                      created automatically.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  View Backup History
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Backup History</DialogTitle>
                  <DialogDescription>
                    Restore from previous backups
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {backupHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No backup history available
                    </p>
                  ) : (
                    backupHistory.map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {formatDate(backup.date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {backup.patientCount} patients,{" "}
                            {backup.appointmentCount} appointments,{" "}
                            {backup.treatmentCount} treatments
                          </div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {backup.type}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Restore
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Data Validation */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Settings className="h-6 w-6 mr-3 text-purple-600" />
            Data Validation & Cleanup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Data Integrity Check</h3>
              <p className="text-sm text-gray-600">
                Scan for orphaned records and duplicates
              </p>
            </div>
            <Button
              onClick={validateData}
              disabled={isValidating}
              variant="outline"
            >
              {isValidating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {isValidating ? "Validating..." : "Validate Data"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-900">
                {validationResults.orphanedAppointments}
              </div>
              <div className="text-sm text-blue-600">Orphaned Appointments</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-900">
                {validationResults.orphanedTreatments}
              </div>
              <div className="text-sm text-purple-600">Orphaned Treatments</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <div className="text-2xl font-bold text-orange-900">
                {validationResults.duplicatePatients}
              </div>
              <div className="text-sm text-orange-600">
                Potential Duplicates
              </div>
            </div>
          </div>

          {(validationResults.orphanedAppointments > 0 ||
            validationResults.orphanedTreatments > 0) && (
            <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <div className="font-medium text-yellow-800">
                    Data Issues Found
                  </div>
                  <div className="text-sm text-yellow-700">
                    Orphaned records detected that can be cleaned up
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCleanupData}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Clean Up
              </Button>
            </div>
          )}

          <Separator />

          {/* Danger Zone */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700">
                  Permanently delete all practice data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      all patients, appointments, treatments, and backup history
                      from your local storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;
