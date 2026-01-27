import { Request, Response, Router } from "express";
import { storage } from "./storage";
import { sendEmail } from "./utils/replitmail";

const router = Router();

// ... existing routes ...

router.post("/api/send-report-email", async (req: Request, res: Response) => {
  try {
    const { reportType, reportData, subject, recipientEmail } = req.body;
    
    console.log('Received email request:', { 
      reportType, 
      subject, 
      recipientEmail, 
      dataLength: reportData?.length,
      timestamp: new Date().toISOString()
    });

    if (!reportData || !subject) {
      console.error('Missing report data or subject');
      return res.status(400).json({ error: "Report data and subject are required" });
    }

    const targetEmail = recipientEmail || "sujay.palande@cybaemtech.com";

    // HTML Template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Report Details</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background: #1e293b;">
                  ${Object.keys(reportData[0] || {}).map(key => 
                    `<th style="padding: 12px; text-align: left; color: white; font-weight: 600;">${key}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${reportData.map((row: any, index: number) => `
                  <tr style="background: ${index % 2 === 0 ? '#ffffff' : '#f1f5f9'};">
                    ${Object.values(row).map(val => 
                      `<td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${val !== null && val !== undefined ? val : '-'}</td>`
                    ).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Note:</strong> This is an automated report from the Site Engineer Management System.
            </p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">Sent to: ${targetEmail}</p>
          </div>
        </div>
      </div>
    `;

    // CSV Generation
    const csvHeaders = Object.keys(reportData[0] || {}).join(',');
    const csvRows = reportData.map((row: any) => 
      Object.values(row).map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvContent = `${csvHeaders}\n${csvRows}`;
    const base64Csv = Buffer.from(csvContent).toString('base64');

    console.log('Dispatching email via Replit Mail to:', targetEmail);
    const result = await sendEmail({
      subject,
      html: htmlContent,
      text: `${subject}\n\nPlease see the attached CSV for details.\n\nSent to: ${targetEmail}`,
      attachments: [{
        filename: `${reportType || 'report'}_${new Date().toISOString().split('T')[0]}.csv`,
        content: base64Csv,
        contentType: 'text/csv',
        encoding: 'base64'
      }]
    });

    console.log('Replit Mail dispatch result:', result);
    res.json({ success: true, message: `Report email sent to ${targetEmail}`, result });
  } catch (error: any) {
    console.error("Critical error in email route:", error);
    res.status(500).json({ 
      error: "Failed to send email", 
      details: error.message
    });
  }
});

export default router;