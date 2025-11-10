import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Pill } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  phone: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Treatment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  medications: Medication[];
  notes: string;
  followUpDate: string;
  cost: number;
}

interface TreatmentFormProps {
  treatment?: Treatment;
  onSave: (treatment: Treatment) => void;
  onCancel: () => void;
}

const commonMedications = [
  "Amoxicillin",
  "Ibuprofen",
  "Acetaminophen",
  "Clindamycin",
  "Penicillin",
  "Hydrocodone",
  "Lidocaine",
  "Chlorhexidine",
  "Metronidazole",
  "Doxycycline",
];

const frequencies = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "As needed",
  "Before meals",
  "After meals",
];

const TreatmentForm = ({ treatment, onSave, onCancel }: TreatmentFormProps) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState<Omit<Treatment, "id">>({
    patientId: treatment?.patientId || "",
    patientName: treatment?.patientName || "",
    appointmentId: treatment?.appointmentId || "",
    date: treatment?.date || new Date().toISOString().split("T")[0],
    diagnosis: treatment?.diagnosis || "",
    treatment: treatment?.treatment || "",
    medications: treatment?.medications || [],
    notes: treatment?.notes || "",
    followUpDate: treatment?.followUpDate || "",
    cost: treatment?.cost || 0,
  });

  useEffect(() => {
    const storedPatients = localStorage.getItem("dentalcare_patients");
    const storedAppointments = localStorage.getItem("dentalcare_appointments");

    if (storedPatients) {
      setPatients(JSON.parse(storedPatients));
    }

    if (storedAppointments) {
      setAppointments(JSON.parse(storedAppointments));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId || !formData.diagnosis || !formData.treatment) {
      toast.error("Please fill in all required fields");
      return;
    }

    const treatmentData: Treatment = {
      id: treatment?.id || Date.now().toString(),
      ...formData,
    };

    onSave(treatmentData);
    toast.success(
      treatment
        ? "Treatment updated successfully"
        : "Treatment recorded successfully"
    );
  };

  const handlePatientChange = (patientId: string) => {
    const selectedPatient = patients.find((p) => p.id === patientId);
    // const patientAppointments = appointments.filter(
    //   (a) => a.patientId === patientId
    // );

    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName: selectedPatient?.name || "",
      appointmentId: "",
    }));
  };

  const handleAppointmentChange = (appointmentId: string) => {
    const selectedAppointment = appointments.find(
      (a) => a.id === appointmentId
    );
    setFormData((prev) => ({
      ...prev,
      appointmentId,
      date: selectedAppointment?.date || prev.date,
    }));
  };

  const addMedication = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ],
    }));
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.map((med, i) =>
        i === index ? { ...med, [field]: value } : med
      ),
    }));
  };

  const patientAppointments = appointments.filter(
    (a) => a.patientId === formData.patientId
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient and Appointment Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patient">Patient *</Label>
          <Select
            value={formData.patientId}
            onValueChange={handlePatientChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name} - {patient.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointment">Related Appointment</Label>
          <Select
            value={formData.appointmentId}
            onValueChange={handleAppointmentChange}
            disabled={!formData.patientId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select appointment (optional)" />
            </SelectTrigger>
            <SelectContent>
              {patientAppointments.map((appointment) => (
                <SelectItem key={appointment.id} value={appointment.id}>
                  {appointment.date} - {appointment.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Treatment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Treatment Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, date: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Treatment Cost ($)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cost: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis *</Label>
        <Textarea
          id="diagnosis"
          value={formData.diagnosis}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))
          }
          placeholder="Enter patient diagnosis..."
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Treatment Performed *</Label>
        <Textarea
          id="treatment"
          value={formData.treatment}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, treatment: e.target.value }))
          }
          placeholder="Describe the treatment performed..."
          rows={3}
          required
        />
      </div>

      {/* Medications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">
            Prescribed Medications
          </Label>
          <Button
            type="button"
            onClick={addMedication}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>

        {formData.medications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <Pill className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No medications prescribed</p>
            <p className="text-sm">
              Click "Add Medication" to prescribe medications
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.medications.map((medication, index) => (
              <Card key={index} className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">Medication {index + 1}</Badge>
                  <Button
                    type="button"
                    onClick={() => removeMedication(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Medication Name *</Label>
                    <Select
                      value={medication.name}
                      onValueChange={(value) =>
                        updateMedication(index, "name", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select medication" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonMedications.map((med) => (
                          <SelectItem key={med} value={med}>
                            {med}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Dosage *</Label>
                    <Input
                      value={medication.dosage}
                      onChange={(e) =>
                        updateMedication(index, "dosage", e.target.value)
                      }
                      placeholder="e.g., 500mg, 2 tablets"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Select
                      value={medication.frequency}
                      onValueChange={(value) =>
                        updateMedication(index, "frequency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={medication.duration}
                      onChange={(e) =>
                        updateMedication(index, "duration", e.target.value)
                      }
                      placeholder="e.g., 7 days, 2 weeks"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <Label>Special Instructions</Label>
                  <Textarea
                    value={medication.instructions}
                    onChange={(e) =>
                      updateMedication(index, "instructions", e.target.value)
                    }
                    placeholder="Take with food, avoid alcohol, etc..."
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="followUpDate">Follow-up Date</Label>
          <Input
            id="followUpDate"
            type="date"
            value={formData.followUpDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                followUpDate: e.target.value,
              }))
            }
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Post-treatment care instructions, observations, etc..."
          rows={3}
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
          {treatment ? "Update Treatment" : "Save Treatment"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default TreatmentForm;
