import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function IncidentReporting() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const reportIncident = useMutation(api.incidents.reportIncident);

  const [formData, setFormData] = useState({
    reporterName: "",
    reporterPhone: "",
    county: "",
    subcounty: "",
    location: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    incidentType: "cattle_rustling" as const,
    description: "",
    incidentDate: new Date().toISOString().split('T')[0],
    numberOfAttackers: undefined as number | undefined,
    suspectedGang: "",
    weaponsUsed: [] as string[],
    casualties: {
      deaths: 0,
      injuries: 0,
      missing: 0,
    },
    livestockStolen: {
      cattle: 0,
      goats: 0,
      sheep: 0,
      camels: 0,
      other: 0,
    },
    propertyDamage: "",
    language: "en",
  });

  const counties = ["Baringo", "Turkana", "West Pokot", "Samburu", "Laikipia", "Isiolo"];
  const incidentTypes = [
    { value: "cattle_rustling", label: "Cattle Rustling" },
    { value: "armed_robbery", label: "Armed Robbery" },
    { value: "kidnapping", label: "Kidnapping" },
    { value: "murder", label: "Murder" },
    { value: "assault", label: "Assault" },
    { value: "property_destruction", label: "Property Destruction" },
    { value: "other", label: "Other" },
  ];

  const commonWeapons = ["AK-47", "G3", "Pistol", "Traditional weapons", "Machetes", "Clubs"];

  const handleWeaponToggle = (weapon: string) => {
    setFormData(prev => ({
      ...prev,
      weaponsUsed: prev.weaponsUsed.includes(weapon)
        ? prev.weaponsUsed.filter(w => w !== weapon)
        : [...prev.weaponsUsed, weapon]
    }));
  };

  const resetForm = () => {
    setFormData({
      reporterName: "",
      reporterPhone: "",
      county: "",
      subcounty: "",
      location: "",
      latitude: undefined,
      longitude: undefined,
      incidentType: "cattle_rustling",
      description: "",
      incidentDate: new Date().toISOString().split('T')[0],
      numberOfAttackers: undefined,
      suspectedGang: "",
      weaponsUsed: [],
      casualties: { deaths: 0, injuries: 0, missing: 0 },
      livestockStolen: { cattle: 0, goats: 0, sheep: 0, camels: 0, other: 0 },
      propertyDamage: "",
      language: "en",
    });
    setIsAnonymous(false);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await reportIncident({
        reporterName: isAnonymous ? undefined : formData.reporterName,
        reporterPhone: isAnonymous ? undefined : formData.reporterPhone,
        isAnonymous,
        county: formData.county,
        subcounty: formData.subcounty || undefined,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        incidentType: formData.incidentType,
        description: formData.description,
        incidentDate: new Date(formData.incidentDate).getTime(),
        numberOfAttackers: formData.numberOfAttackers,
        suspectedGang: formData.suspectedGang || undefined,
        weaponsUsed: formData.weaponsUsed,
        casualties: formData.casualties,
        livestockStolen: formData.livestockStolen,
        propertyDamage: formData.propertyDamage || undefined,
        language: formData.language,
      });

      toast.success("Incident reported successfully");
      resetForm();
    } catch (error) {
      toast.error("Failed to report incident");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToStep = (step: number) => {
    switch (step) {
      case 2:
        return formData.county && formData.location;
      case 3:
        return formData.incidentType && formData.description && formData.incidentDate;
      case 4:
        return true; // Optional step
      default:
        return true;
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-6 px-4">
      <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-8 sm:w-12 h-1 ${
                  currentStep > step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const NavigationButtons = () => (
    <div className="flex justify-between items-center pt-6 border-t">
      <button
        type="button"
        onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
        disabled={currentStep === 1}
        className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear
        </button>
        
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!canProceedToStep(currentStep + 1)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !canProceedToStep(2) || !canProceedToStep(3)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Report Security Incident</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Report security incidents to help authorities respond quickly and effectively.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <StepIndicator />

          {/* Step 1: Reporter Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Reporter Information</h3>
              
              {/* Anonymous Toggle */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium text-blue-900 block">
                      Report Anonymously
                    </span>
                    <p className="text-xs text-blue-700 mt-1">
                      Your identity will be kept confidential if you choose anonymous reporting
                    </p>
                  </div>
                </label>
              </div>

              {!isAnonymous && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.reporterName}
                      onChange={(e) => setFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, reporterPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Location Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County *
                  </label>
                  <select
                    value={formData.county}
                    onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    <option value="">Select County</option>
                    {counties.map(county => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-County
                  </label>
                  <input
                    type="text"
                    value={formData.subcounty}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcounty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Enter sub-county"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Village, landmark, or area name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Incident Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Incident Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Incident Type *
                  </label>
                  <select
                    value={formData.incidentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, incidentType: e.target.value as any }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    {incidentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Incident *
                  </label>
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    placeholder="Provide detailed description of what happened..."
                  />
                </div>
                
                {/* Attacker Information */}
                <div className="border-t pt-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Attacker Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Attackers
                      </label>
                      <input
                        type="number"
                        value={formData.numberOfAttackers || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfAttackers: e.target.value ? parseInt(e.target.value) : undefined }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="Approximate number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suspected Gang/Group
                      </label>
                      <input
                        type="text"
                        value={formData.suspectedGang}
                        onChange={(e) => setFormData(prev => ({ ...prev, suspectedGang: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="If known"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weapons Used
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {commonWeapons.map(weapon => (
                          <label key={weapon} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={formData.weaponsUsed.includes(weapon)}
                              onChange={() => handleWeaponToggle(weapon)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{weapon}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Impact Assessment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Impact Assessment</h3>
              
              {/* Casualties */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Human Casualties</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deaths</label>
                    <input
                      type="number"
                      value={formData.casualties.deaths}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        casualties: { ...prev.casualties, deaths: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Injuries</label>
                    <input
                      type="number"
                      value={formData.casualties.injuries}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        casualties: { ...prev.casualties, injuries: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Missing</label>
                    <input
                      type="number"
                      value={formData.casualties.missing}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        casualties: { ...prev.casualties, missing: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Livestock */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Livestock Stolen</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cattle</label>
                    <input
                      type="number"
                      value={formData.livestockStolen.cattle}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        livestockStolen: { ...prev.livestockStolen, cattle: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Goats</label>
                    <input
                      type="number"
                      value={formData.livestockStolen.goats}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        livestockStolen: { ...prev.livestockStolen, goats: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sheep</label>
                    <input
                      type="number"
                      value={formData.livestockStolen.sheep}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        livestockStolen: { ...prev.livestockStolen, sheep: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Camels</label>
                    <input
                      type="number"
                      value={formData.livestockStolen.camels}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        livestockStolen: { ...prev.livestockStolen, camels: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other</label>
                    <input
                      type="number"
                      value={formData.livestockStolen.other}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        livestockStolen: { ...prev.livestockStolen, other: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Property Damage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property Damage Description
                </label>
                <textarea
                  value={formData.propertyDamage}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyDamage: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Describe any property damage or destruction..."
                />
              </div>
            </div>
          )}

          <NavigationButtons />
        </form>
      </div>
    </div>
  );
}
