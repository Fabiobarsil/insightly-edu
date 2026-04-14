import { reportTemplate } from "./reportTemplate";

export function generateReport(data) {
  let html = reportTemplate;
  
  // Replace all template variables
  html = html.replace(/{{school_logo}}/g, data.school_logo || "");
  html = html.replace(/{{school_name}}/g, data.school_name || "");
  html = html.replace(/{{school_cnpj}}/g, data.school_cnpj || "");
  html = html.replace(/{{school_address}}/g, data.school_address || "");
  html = html.replace(/{{school_contact}}/g, data.school_contact || "");
  html = html.replace(/{{student_name}}/g, data.student_name || "");
  html = html.replace(/{{class_name}}/g, data.class_name || "");
  html = html.replace(/{{avg}}/g, data.avg || "");
  html = html.replace(/{{freq}}/g, data.freq || "");
  html = html.replace(/{{status_class}}/g, data.status_class || "");
  html = html.replace(/{{status}}/g, data.status || "");
  html = html.replace(/{{diagnosis}}/g, data.diagnosis || "");
  html = html.replace(/{{interventions_list}}/g, data.interventions_list || "");
  html = html.replace(/{{conclusion}}/g, data.conclusion || "");
  html = html.replace(/{{date}}/g, data.date || new Date().toLocaleDateString("pt-BR"));
  
  // Open new tab with the report
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
