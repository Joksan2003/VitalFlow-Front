import "../styles/plan.css";
export default function PlanGenerador({ onGenerate }) {
  return (
    <section className="border rounded-lg p-6 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Configuración de tu Plan</h2>

      {/* Datos de ejemplo - más adelante se pueden obtener del perfil */}
      <div className="grid grid-cols-3 text-center mb-6">
        <div><p className="text-3xl font-bold text-green-600">28</p><p className="text-gray-500">años</p></div>
        <div><p className="text-3xl font-bold text-blue-600">65</p><p className="text-gray-500">kg</p></div>
        <div><p className="text-3xl font-bold text-purple-600">165</p><p className="text-gray-500">cm</p></div>
      </div>

      <p className="text-gray-700 mb-2"><b>Nivel de Actividad Física:</b> Moderado (3-5 días/semana)</p>
      <p className="text-gray-700 mb-2"><b>Objetivo:</b> Mantener peso y ganar energía</p>
      <p className="text-gray-700 mb-4"><b>Dieta:</b> Vegetariana | <b>Alergias:</b> Nueces</p>

      <button
        onClick={onGenerate}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
      >
        Generar Mi Plan Semanal
      </button>
    </section>
  );
}