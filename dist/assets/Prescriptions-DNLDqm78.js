import{r as h,j as e,a9 as m,W as S,a1 as R,an as u}from"./react-vendor-ClXfgOfx.js";import{q as a,I as T,C as c,c as d,B as y,a as k,b as O}from"./lab-FzrieG4E.js";import"./ui-vendor-BA32w1ww.js";import"./vendor-CungF8aD.js";import"./supabase-vendor-BqyqeuEA.js";import"./pdf-vendor-BIFCviiP.js";const H=()=>{const[o,f]=h.useState(""),[n,g]=h.useState([]),[v,b]=h.useState(!1),x=[],r={patientName:"Lila Ganvir",patientId:"IH25F05013",billDetails:[{billNo:"SB-28466",mode:"Credit",date:"06/06/2025",amount:194,paid:0,discount:0,netAmount:194,prescriptionData:[{medicine:"HEPARIN",quantity:1},{medicine:"SURGICAL PRODUCT",quantity:1},{medicine:"Inj SODIUM CHLORIDE(0.9%W/V)100ML I.V",quantity:1}]},{billNo:"SB-28331",mode:"Credit",date:"05/06/2025",amount:854,paid:0,discount:0,netAmount:854,prescriptionData:[{medicine:"NICORNADIL (5MG)",quantity:2},{medicine:"BISOPROLOL-2.5 MG TAB",quantity:1},{medicine:"ATORVASTINE-40MG TAB",quantity:2},{medicine:"Torasemide (20mg)",quantity:2}]},{billNo:"SB-28200",mode:"Credit",date:"04/06/2025",amount:450,paid:0,discount:0,netAmount:450,prescriptionData:[{medicine:"METFORMIN 500mg",quantity:2},{medicine:"LISINOPRIL 10mg",quantity:1},{medicine:"VITAMIN D3",quantity:1}]},{billNo:"SB-28100",mode:"Credit",date:"03/06/2025",amount:320,paid:0,discount:0,netAmount:320,prescriptionData:[{medicine:"AMOXICILLIN 500mg",quantity:2},{medicine:"PARACETAMOL 500mg",quantity:1},{medicine:"COUGH SYRUP",quantity:1}]}]};x.filter(t=>{var s,i,l;return((s=t.patientName)==null?void 0:s.toLowerCase().includes(o.toLowerCase()))||((i=t.patientId)==null?void 0:i.toLowerCase().includes(o.toLowerCase()))||((l=t.doctor)==null?void 0:l.toLowerCase().includes(o.toLowerCase()))});const j=r.billDetails.reduce((t,s)=>t+s.netAmount,0),w=()=>{console.log("Creating new prescription")},C=t=>{console.log("Printing prescription:",t),window.print()},P=t=>{g(s=>s.includes(t)?s.filter(i=>i!==t):[...s,t])},A=()=>{n.length>0?b(!0):alert("Please select at least one row")},I=()=>{console.log("Money collected functionality")},D=()=>{b(!1)},L=()=>{document.body.innerHTML;const t=document.getElementById("prescription-content");if(t){const s=window.open("","_blank");s&&(s.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Prescription Print</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 0; 
                  padding: 20px;
                }
                .prescription-container {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 20px;
                }
                .prescription-item {
                  border: 1px solid #333;
                  padding: 15px;
                  break-inside: avoid;
                }
                .prescription-header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
                }
                .logo-placeholder {
                  height: 48px;
                  width: auto;
                  background-color: #e5e7eb;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                }
                .prescription-title {
                  text-align: center;
                  font-weight: bold;
                  font-size: 14px;
                  margin-bottom: 10px;
                }
                .patient-info {
                  margin-bottom: 10px;
                  font-size: 12px;
                }
                .rx-header {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 10px;
                  font-size: 12px;
                }
                .medicine-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 10px;
                  font-size: 12px;
                }
                .medicine-table td {
                  border: 1px solid #333;
                  padding: 4px 8px;
                }
                .doctor-signature {
                  margin-top: 20px;
                  border-top: 1px solid #333;
                  padding-top: 5px;
                  font-size: 12px;
                }
                @media print {
                  .prescription-container {
                    grid-template-columns: 1fr 1fr;
                  }
                  body { margin: 0; padding: 10px; }
                }
              </style>
            </head>
            <body>
              ${t.innerHTML}
            </body>
          </html>
        `),s.document.close(),s.focus(),s.print(),s.close())}};return e.jsx("div",{className:"min-h-screen bg-background p-6",children:e.jsxs("div",{className:"max-w-7xl mx-auto space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-6 w-6"}),e.jsx("h1",{className:"text-3xl font-bold",children:"Prescriptions"})]}),e.jsxs(a,{onClick:w,className:"flex items-center gap-2",children:[e.jsx(S,{className:"h-4 w-4"}),"New Prescription"]})]}),e.jsx("div",{className:"flex items-center gap-4",children:e.jsxs("div",{className:"relative flex-1",children:[e.jsx(R,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"}),e.jsx(T,{placeholder:"Search by patient name, ID, or doctor...",value:o,onChange:t=>f(t.target.value),className:"pl-10"})]})}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[e.jsx(c,{children:e.jsx(d,{className:"p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Total Prescriptions"}),e.jsx("p",{className:"text-2xl font-bold",children:x.length})]}),e.jsx(m,{className:"h-8 w-8 text-primary"})]})})}),e.jsx(c,{children:e.jsx(d,{className:"p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Active Prescriptions"}),e.jsx("p",{className:"text-2xl font-bold",children:x.filter(t=>t.status==="Active").length})]}),e.jsx(y,{className:"bg-green-100 text-green-800",children:"Active"})]})})}),e.jsx(c,{children:e.jsx(d,{className:"p-4",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-muted-foreground",children:"Completed Prescriptions"}),e.jsx("p",{className:"text-2xl font-bold",children:x.filter(t=>t.status==="Completed").length})]}),e.jsx(y,{className:"bg-gray-100 text-gray-800",children:"Completed"})]})})})]}),e.jsxs(c,{children:[e.jsx(k,{children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx(O,{className:"text-lg",children:"Sales Bill"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(a,{variant:"outline",size:"sm",onClick:()=>C(),className:"flex items-center gap-1",children:[e.jsx(u,{className:"h-3 w-3"}),"Print"]}),e.jsxs(a,{variant:"outline",size:"sm",onClick:A,className:"flex items-center gap-1 text-green-600 hover:text-green-800",children:[e.jsx(m,{className:"h-3 w-3"}),"Generate Prescription"]}),e.jsx(a,{variant:"outline",size:"sm",onClick:I,className:"flex items-center gap-1 text-blue-600 hover:text-blue-800",children:"Money Collected"})]})]})}),e.jsxs(d,{children:[e.jsx("div",{className:"mb-4",children:e.jsxs("p",{className:"text-sm",children:["Patient Name: ",r.patientName]})}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-sm border-collapse border border-gray-300",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-gray-200",children:[e.jsx("th",{className:"border border-gray-300 px-2 py-1 w-10",children:e.jsx("input",{type:"checkbox",onChange:t=>{g(t.target.checked?r.billDetails.map((s,i)=>i):[])},checked:n.length===r.billDetails.length})}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Bill No."}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Mode"}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Date"}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Amt."}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Paid"}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Disc"}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Net Amt"}),e.jsx("th",{className:"border border-gray-300 px-2 py-1",children:"Action"})]})}),e.jsx("tbody",{children:r.billDetails.map((t,s)=>e.jsxs("tr",{className:"border",children:[e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-center",children:e.jsx("input",{type:"checkbox",checked:n.includes(s),onChange:()=>P(s)})}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-center",children:t.billNo}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-center",children:t.mode}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-center",children:t.date}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:t.amount.toFixed(2)}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:t.paid.toFixed(2)}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:t.discount.toFixed(2)}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:t.netAmount.toFixed(2)}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-center",children:e.jsxs("div",{className:"flex justify-center gap-1",children:[e.jsx(a,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",title:"View",children:"👁️"}),e.jsx(a,{variant:"ghost",size:"sm",className:"h-6 w-6 p-0",title:"Print",children:"🖨️"})]})})]},s))}),e.jsx("tfoot",{children:e.jsxs("tr",{className:"bg-gray-100 font-bold",children:[e.jsx("td",{colSpan:4,className:"border border-gray-300 px-2 py-1 text-center",children:"Total:"}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:j.toFixed(2)}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:"0.00"}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:"0.00"}),e.jsx("td",{className:"border border-gray-300 px-2 py-1 text-right",children:j.toFixed(2)}),e.jsx("td",{className:"border border-gray-300 px-2 py-1"})]})})]})})]})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsx("h2",{className:"text-xl font-semibold",children:"All Prescriptions"}),e.jsx(c,{children:e.jsxs(d,{className:"p-8 text-center",children:[e.jsx(m,{className:"h-12 w-12 text-muted-foreground mx-auto mb-4"}),e.jsx("h3",{className:"text-lg font-medium mb-2",children:"No prescriptions found"}),e.jsx("p",{className:"text-muted-foreground",children:"Get started by creating your first prescription."})]})})]}),v&&e.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center",children:e.jsxs("div",{className:"bg-white p-4 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto",children:[e.jsxs("div",{className:"flex justify-between items-center mb-4",children:[e.jsx("h2",{className:"text-lg font-bold",children:"Prescription"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(a,{variant:"outline",size:"sm",onClick:L,className:"flex items-center gap-1",children:[e.jsx(u,{className:"h-3 w-3"}),"Print"]}),e.jsx(a,{variant:"outline",size:"sm",onClick:D,className:"text-red-600 hover:text-red-900",children:"✖️"})]})]}),e.jsx("div",{id:"prescription-content",children:e.jsx("div",{className:"prescription-container",children:Array.from({length:Math.ceil(n.length/2)}).map((t,s)=>e.jsx("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[0,1].map(i=>{const l=n[s*2+i];if(l===void 0)return null;const p=r.billDetails[l];return e.jsxs("div",{className:"prescription-item border border-gray-300 p-2",children:[e.jsxs("div",{className:"prescription-header flex justify-between mb-2",children:[e.jsx("div",{className:"logo-placeholder h-12 w-auto bg-gray-200 flex items-center justify-center text-xs",children:"NABH Logo"}),e.jsx("div",{className:"logo-placeholder h-12 w-auto bg-gray-200 flex items-center justify-center text-xs",children:"Hope Logo"})]}),e.jsx("div",{className:"prescription-title text-center mb-2",children:e.jsx("h2",{className:"font-bold text-sm",children:"Prescription"})}),e.jsxs("div",{className:"patient-info mb-2",children:[e.jsxs("p",{className:"text-xs",children:[e.jsx("strong",{children:"Patient Name:"})," ",r.patientName]}),e.jsxs("p",{className:"text-xs",children:[e.jsx("strong",{children:"Registration Number:"})," ",r.patientId]})]}),e.jsxs("div",{className:"rx-header flex justify-between mb-2",children:[e.jsx("p",{className:"text-xs",children:"Rx"}),e.jsxs("p",{className:"text-xs",children:["Date: ",p.date]})]}),e.jsx("table",{className:"medicine-table w-full text-xs border-collapse mb-2",children:e.jsx("tbody",{children:p.prescriptionData.map((N,M)=>e.jsxs("tr",{children:[e.jsx("td",{className:"border border-gray-300 px-1 py-0.5",children:N.medicine}),e.jsx("td",{className:"border border-gray-300 px-1 py-0.5 text-center",children:N.quantity})]},M))})}),e.jsx("div",{className:"doctor-signature mt-4 border-t pt-1",children:e.jsx("p",{className:"text-xs",children:"Rajshree Mane(Nephrology)"})})]},p.billNo)})},s))})})]})})]})})};export{H as default};
