import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  Stethoscope,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  dataManager,
  Patient,
  Appointment,
  Treatment,
} from "@/lib/dataManager";

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedPatients = dataManager.getPatients();
    const loadedAppointments = dataManager.getAppointments();
    const loadedTreatments = dataManager.getTreatments();

    setPatients(loadedPatients);
    setAppointments(loadedAppointments);
    setTreatments(loadedTreatments);

    // Filter today's appointments
    const today = new Date().toISOString().split("T")[0];
    const todayAppts = loadedAppointments.filter((apt) => apt.date === today);
    setTodayAppointments(todayAppts);
  };

  const getPatientInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01 ${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getTotalRevenue = () => {
    return treatments.reduce((total, treatment) => total + treatment.cost, 0);
  };

  const getMonthlyRevenue = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    return treatments
      .filter((treatment) => {
        const treatmentDate = new Date(treatment.date);
        return (
          treatmentDate.getMonth() === thisMonth &&
          treatmentDate.getFullYear() === thisYear
        );
      })
      .reduce((total, treatment) => total + treatment.cost, 0);
  };

  const getRevenueGrowth = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthRevenue = treatments
      .filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum, t) => sum + t.cost, 0);

    const lastMonthRevenue = treatments
      .filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
        );
      })
      .reduce((sum, t) => sum + t.cost, 0);

    if (lastMonthRevenue === 0) return 0;
    return Math.round(
      ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    );
  };

  const getCompletionRate = () => {
    const total = appointments.length;
    const completed = appointments.filter(
      (apt) => apt.status === "completed"
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split("T")[0];
    return appointments.filter(
      (apt) => apt.date > today && apt.status === "scheduled"
    ).length;
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                Welcome to  Dealio Dental
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Your comprehensive practice management solution. Track patients,
                manage appointments, and grow your dental practice with
                professional tools.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-xs rounded-full px-4 py-2">
                  <Activity className="h-5 w-5" />
                  <span className="font-medium">Live Dashboard</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-xs rounded-full px-4 py-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Real-time Updates</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Link to="/patients">
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Patients
                </Button>
              </Link>
              <Link to="/appointments">
                <Button className="w-full bg-white/10 backdrop-blur-xs border border-white/20 text-white hover:bg-white/20">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-linear-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Active Patients
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {patients.length}
                </p>
                <p className="text-xs text-blue-600 mt-1">Total registered</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">
                  Today's Schedule
                </p>
                <p className="text-3xl font-bold text-green-900">
                  {todayAppointments.length}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Appointments today
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Calendar className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Completion Rate
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {getCompletionRate()}%
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Appointment success
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-linear-to-br from-emerald-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">
                  Monthly Revenue
                </p>
                <p className="text-3xl font-bold text-emerald-900">
                  {formatCurrency(getMonthlyRevenue())}
                </p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600 mr-1" />
                  <p className="text-xs text-emerald-600">
                    {getRevenueGrowth()}% growth
                  </p>
                </div>
              </div>
              <div className="p-3 bg-emerald-200 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Clock className="h-6 w-6 mr-3 text-blue-600" />
                  Today's Schedule
                </CardTitle>
                <Link to="/appointments">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No appointments scheduled for today
                  </p>
                  <Link to="/appointments">
                    <Button className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </Link>
                </div>
              ) : (
                todayAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                          {getPatientInitials(appointment.patientName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.patientName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {appointment.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatTime(appointment.time)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-3 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/patients" className="block">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white">
                  <Users className="h-4 w-4 mr-3" />
                  Register New Patient
                </Button>
              </Link>
              <Link to="/appointments" className="block">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                  <Calendar className="h-4 w-4 mr-3" />
                  Schedule Appointment
                </Button>
              </Link>
              <Link to="/treatments" className="block">
                <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white">
                  <Stethoscope className="h-4 w-4 mr-3" />
                  Record Treatment
                </Button>
              </Link>
              <Link to="/data-management" className="block">
                <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Activity className="h-4 w-4 mr-3" />
                  Manage Data
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Practice Overview */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 flex items-center">
                <TrendingUp className="h-6 w-6 mr-3 text-purple-600" />
                Practice Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Appointment Completion
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {getCompletionRate()}%
                  </span>
                </div>
                <Progress value={getCompletionRate()} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-900">
                    {getUpcomingAppointments()}
                  </p>
                  <p className="text-xs text-blue-600">Upcoming</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-900">
                    {treatments.length}
                  </p>
                  <p className="text-xs text-green-600">Treatments</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(getTotalRevenue())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-indigo-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {treatments.slice(0, 3).map((treatment) => (
              <div
                key={treatment.id}
                className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-blue-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Stethoscope className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Treatment completed for {treatment.patientName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {treatment.diagnosis}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-600">
                    {formatCurrency(treatment.cost)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(treatment.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}

            {treatments.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity to display</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
