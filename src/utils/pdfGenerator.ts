import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Medication } from "../types";

export const generateMedicationPDF = (medications: Medication[]) => {
  const doc = new jsPDF();
  doc.text("Liste des médicaments", 10, 10);
  (doc as any).autoTable({
    head: [['Nom (FR)', 'Principe Actif (FR)', 'Classe']],
    body: medications.map(m => [m.nameFr, m.activeIngredientFr, m.classFr]),
  });
  doc.save("medicaments.pdf");
};
