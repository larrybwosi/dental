import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  CalendarDays,
  TrendingUp,
  Filter,
  Search,
} from "lucide-react";
import AppointmentForm from "@/components/AppointmentForm";
import { dataManager, Appointment } from "@/lib/dataManager";
import { toast } from "sonner";

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    let filtered = appointments.filter(
      (appointment) =>
        appointment.patientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        appointment.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (appointment) => appointment.status === statusFilter
      );
    }

    // Sort by date and time
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter]);

  const loadAppointments = () => {
    const loadedAppointments = dataManager.getAppointments();
    setAppointments(loadedAppointments);
  };

  const handleAddAppointment = (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      dataManager.addAppointment(appointmentData);
      loadAppointments();
      setShowAddDialog(false);
      toast.success("Appointment scheduled successfully");
    } catch (error) {
      toast.error("Failed to schedule appointment");
    }
  };

  const handleEditAppointment = (
    appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!editingAppointment) return;

    try {
      dataManager.updateAppointment(editingAppointment.id, appointmentData);
      loadAppointments();
      setEditingAppointment(null);
      toast.success("Appointment updated successfully");
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const handleDeleteAppointment = (id: string) => {
    try {
      dataManager.deleteAppointment(id);
      loadAppointments();
      toast.success("Appointment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete appointment");
    }
  };

  const handleStatusChange = (
    id: string,
    status: "scheduled" | "completed" | "cancelled"
  ) => {
    try {
      dataManager.updateAppointment(id, { status });
      loadAppointments();
      toast.success(`Appointment marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update appointment status");
    }
  };

  const getPatientInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Scheduled
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === today).length;
  };

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter(
      (apt) => apt.date > today && apt.status === "scheduled"
    ).length;
  };

  const getCompletionRate = () => {
    const total = appointments.length;
    const completed = appointments.filter(
      (apt) => apt.status === "completed"
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Appointment Management
          </h1>
          <p className="text-gray-600 mt-1">
            Schedule and manage patient appointments
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for a patient.
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm onSubmit={handleAddAppointment} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Today's Schedule
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {getTodayAppointments()}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <CalendarDays className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-green-900">
                  {getUpcomingAppointments()}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Calendar className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {getCompletionRate()}%
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">
                  Total Appointments
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {appointments.length}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Clock className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments by patient name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAppointments.map((appointment) => (
          <Card
            key={appointment.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold">
                      {getPatientInitials(appointment.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      {appointment.patientName}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{appointment.type}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingAppointment(appointment)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {appointment.status === "scheduled" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(appointment.id, "completed")
                        }
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                    {appointment.status === "scheduled" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(appointment.id, "cancelled")
                        }
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  {formatDate(appointment.date)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-green-500" />
                  {formatTime(appointment.time)} ({appointment.duration} min)
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2 text-purple-500" />
                  Patient ID: {appointment.patientId.slice(-6)}
                </div>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(appointment.status)}
              </div>

              {appointment.notes && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-600">{appointment.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Badge variant="secondary" className="text-xs">
                  ID: {appointment.id.slice(-6)}
                </Badge>
                <span className="text-xs text-gray-500">
                  Created: {formatDate(appointment.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all"
                ? "No appointments match your search criteria."
                : "Get started by scheduling your first appointment."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Appointment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Appointment Dialog */}
      <Dialog
        open={!!editingAppointment}
        onOpenChange={() => setEditingAppointment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update the appointment details.
            </DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <AppointmentForm
              initialData={editingAppointment}
              onSubmit={handleEditAppointment}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;
