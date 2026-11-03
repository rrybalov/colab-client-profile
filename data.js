// Sample data for the CoLab client profile prototype.
// Everything here is fictional. Replace with API calls when the backend exists.
window.COLAB_DATA = {
  client: {
    name: 'Jimothy Jones',
    tags: ['IPV', 'ACGO'],
    mciId: '1234567890',
    ssnLast4: '1234',
    ssnFull: '123-45-1234',
    paDhsId: '470106828',
    dpwRecord: '123456778890'
  },

  providers: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'],

  // Services tab. `all` = providers in the All Services view, `grouped` = Grouped Services view.
  services: [
    { id: 's1', first: '02/09/2000', last: '07/16/2025', area: 'Substance Use Disorder Services (All)', all: ['Mercy'], grouped: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'], service: 'D & A Service Plan Announcement', program: 'Child Welfare', added: '02/09/2000' },
    { id: 's2', first: '05/12/2008', last: '06/30/2025', area: 'Mental Health Services (All)', all: ['Mercy'], grouped: ['Mercy'], service: 'Mobile Crisis, Team Delivered', program: 'Justice Involvement', added: '05/12/2008' },
    { id: 's3', first: '11/03/2011', last: '05/19/2025', area: 'Substance Use Disorder Services (All)', all: ['P.O.W.E.R.'], grouped: ['P.O.W.E.R.'], service: 'Telephone Crisis', program: 'Behavioral Health', added: '11/03/2011' },
    { id: 's4', first: '01/27/2014', last: '04/02/2025', area: 'Mental Health Services (All)', all: ['UPMC'], grouped: ['UPMC'], service: 'Administrative Management', program: 'Family Strengthening', added: '01/27/2014' },
    { id: 's5', first: '08/15/2016', last: '03/11/2025', area: '', all: ['Mercy'], grouped: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'], service: 'Individual Psychotherapy - 75 - 80 minute sessions (OPDA)', program: 'Developmental Support', added: '08/15/2016' },
    { id: 's6', first: '02/02/2019', last: '01/20/2025', area: 'Mental Health Services (All)', all: ['UPMC'], grouped: ['Mercy', 'UPMC', 'P.O.W.E.R.', 'Revival Inc'], service: 'Telephone Crisis', program: 'Housing', added: '02/02/2019' },
    { id: 's7', first: '09/09/2021', last: '12/04/2024', area: 'Substance Use Disorder Services (All)', all: ['Revival Inc'], grouped: [], service: 'Administrative Management', program: 'Physical Health', added: '09/09/2021' }
  ],

  // Providers tab
  providerSummary: [
    { provider: 'Mercy', program: 'Behavioral Health', first: '02/09/2000', last: '07/16/2025', dx: 'Code 305', facility: '2nd Ave Commons', units: '2', status: 'Active', rate: '$30.00', rateType: 'Per Diem', cost: '$60.00' },
    { provider: 'P.O.W.E.R.', program: 'Housing', first: '06/01/2010', last: '05/19/2025', dx: 'Code 412', facility: 'Wood Street Commons', units: '12', status: 'Paid', rate: '$45.00', rateType: 'Per Unit', cost: '$540.00' },
    { provider: 'UPMC', program: 'Behavioral Health', first: '01/27/2014', last: '04/02/2025', dx: 'Code 296', facility: 'UPMC Western Psychiatric Hospital', units: '8', status: 'Paid', rate: '$55.00', rateType: 'Per Session', cost: '$440.00' },
    { provider: 'Revival Inc', program: 'Justice', first: '09/09/2021', last: '12/04/2024', dx: 'Code 305', facility: 'Allegheny County Jail', units: '3', status: 'Denied', rate: '$30.00', rateType: 'Per Diem', cost: '$90.00' }
  ],

  // Service details: instances of one service
  serviceInstances: [
    { first: '02/09/2000', last: '07/16/2025', program: 'Behavioral Health', dx: 'Code 305', provider: 'UPMC Western Psychiatric Hospital', facility: '2nd Ave Commons', units: '2', status: 'Active', rate: '$30.00', rateType: 'Per Diem', cost: '$60.00' },
    { first: '03/14/2004', last: '05/02/2025', program: 'Behavioral Health', dx: 'Code 305', provider: 'Mercy', facility: '2nd Ave Commons', units: '5', status: 'Active', rate: '$30.00', rateType: 'Per Diem', cost: '$150.00' },
    { first: '06/01/2010', last: '11/18/2024', program: 'Housing', dx: 'Code 412', provider: 'P.O.W.E.R.', facility: 'Wood Street Commons', units: '12', status: 'Paid', rate: '$45.00', rateType: 'Per Unit', cost: '$540.00' },
    { first: '09/22/2013', last: '08/09/2024', program: 'Justice', dx: 'Code 305', provider: 'Revival Inc', facility: 'Allegheny County Jail', units: '3', status: 'Denied', rate: '$30.00', rateType: 'Per Diem', cost: '$90.00' },
    { first: '01/05/2018', last: '02/27/2024', program: 'Behavioral Health', dx: 'Code 296', provider: 'Mercy', facility: 'Mercy Behavioral Health', units: '8', status: 'Paid', rate: '$55.00', rateType: 'Per Session', cost: '$440.00' },
    { first: '04/30/2020', last: '10/15/2023', program: 'Housing', dx: 'Code 412', provider: 'UPMC Western Psychiatric Hospital', facility: '2nd Ave Commons', units: '1', status: 'Pending', rate: '$30.00', rateType: 'Per Diem', cost: '$30.00' }
  ],

  // Provider details: services delivered by one provider
  providerServices: [
    { service: 'Mobile Crisis, Team Delivered', first: '02/09/2000', last: '07/16/2025', program: 'Behavioral Health', facility: '2nd Ave Commons', units: '2', status: 'Active', rate: '$30.00', rateType: 'Per Diem', cost: '$60.00' },
    { service: 'Administrative Management', first: '03/14/2004', last: '05/02/2025', program: 'Behavioral Health', facility: '2nd Ave Commons', units: '5', status: 'Active', rate: '$30.00', rateType: 'Per Diem', cost: '$150.00' },
    { service: 'Telephone Crisis', first: '11/03/2011', last: '01/20/2025', program: 'Justice', facility: 'Allegheny County Jail', units: '4', status: 'Paid', rate: '$25.00', rateType: 'Per Call', cost: '$100.00' },
    { service: 'D & A Service Plan Announcement', first: '06/01/2010', last: '09/30/2024', program: 'Housing', facility: 'Wood Street Commons', units: '1', status: 'Pending', rate: '$75.00', rateType: 'Per Unit', cost: '$75.00' },
    { service: 'Individual Psychotherapy - 75 - 80 minute sessions (OPDA)', first: '08/15/2016', last: '03/11/2025', program: 'Behavioral Health', facility: '2nd Ave Commons', units: '6', status: 'Paid', rate: '$55.00', rateType: 'Per Session', cost: '$330.00' }
  ],

  // Client Overview > Program Enrollment. kind: active | ending | presumed | inactive
  enrollments: [
    { name: 'Supplemental Nutrition Assistance Program (SNAP)', asOf: 'As of 09/22/2026 | 6 weeks ago', stale: true, kind: 'active', status: 'Active', pct: 78, start: '07/30/2024', end: '07/30/2027' },
    { name: 'Supplemental Security Income (SSI)', asOf: 'As of 10/30/2026', stale: false, kind: 'active', status: 'Active', pct: 78, start: '07/30/2024', end: '07/30/2027' },
    { name: 'Temporary Assistance for Needy Families (TANF)', asOf: 'As of 03/14/2026', stale: false, kind: 'presumed', status: 'Presumed Inactive', pct: 0, start: '07/30/2024', end: '07/30/2027' },
    { name: 'Medicaid', asOf: 'As of 10/30/2026', stale: false, kind: 'ending', status: 'Ending soon', pct: 94, start: '07/30/2024', end: '12/31/2026' },
    { name: 'Allegheny GO', asOf: 'As of 11/03/2026 | Today', stale: false, kind: 'active', status: 'Active', pct: 78, start: '07/30/2024', end: '07/30/2027' },
    { name: '[Program Name that is currently inactive]', asOf: 'As of 01/05/2026', stale: false, kind: 'inactive', status: 'Inactive', pct: 0, start: '07/30/2024', end: '07/30/2027' }
  ],

  // Program Info > Case History
  cases: [
    { otn: 'R1234567890', date: '02/09/2022', agency: 'Pittsburgh Police Department', filed: '02/09/2022', charge: 'Robbery of Motor Vehicle', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '03/02/2022', dv: false },
    { otn: 'R1234567891', date: '01/14/2022', agency: 'Pittsburgh Police Department', filed: '01/15/2022', charge: 'Arrest For Violation of Order (PFA)', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '02/04/2022', dv: true },
    { otn: 'R1234567892', date: '10/03/2021', agency: 'Pittsburgh Police Department', filed: '10/04/2021', charge: 'Burglary - Not Adapted for Overnight Accommodation', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '10/25/2021', dv: true },
    { otn: 'R1234567893', date: '06/22/2021', agency: 'Pittsburgh Police Department', filed: '06/22/2021', charge: 'Arrest For Violation of Order (PFA)', disp: 'Sent to Common Pleas', next: 'Preliminary Hearing', nextDate: '07/13/2021', dv: true }
  ],

  // Program Info > Incarceration History. kind: housing | hold | prison
  incarceration: [
    { label: '2023–2026', items: [
      { id: 'i1', title: 'Community residential placement', kind: 'housing', range: 'Dec 16, 2024 to Jul 2026', dur: '19 months', facility: '[Community corrections center]' },
      { id: 'i2', title: 'Behavioral health hold', kind: 'hold', range: 'Mar 3, 2024 to Apr 2, 2024', dur: '1 month', facility: '[Hospital name]' },
      { id: 'i3', title: 'State sentence', kind: 'prison', range: 'Jan 9, 2023 to Feb 20, 2024', dur: '13 months', facility: '[State correctional institution]' }
    ] },
    { label: '2022', items: [
      { id: 'i4', title: 'Community residential placement', kind: 'housing', range: 'Jun 1, 2022 to Dec 15, 2022', dur: '6 months', facility: '[Community corrections center]' },
      { id: 'i5', title: 'Community residential placement', kind: 'housing', range: 'Feb 7, 2022 to May 30, 2022', dur: '4 months', facility: '[Community corrections center]' }
    ] }
  ],

  notes: [
    { id: 'n1', date: '10/28/2026', edited: true, text: "DA's office confirmed that they will not close out the case until the individual completes BIP. WCS confirmed connecting with the DA's Office about coordinating around this case. Pending are updates needed from DHS about the individual's BIP attendance and engagement." },
    { id: 'n2', date: '10/21/2026', edited: false, text: "WCS confirmed it is coordinating with the DA's Office on this case. Next step is a joint call before the November case conference." },
    { id: 'n3', date: '10/14/2026', edited: false, text: 'Probation officer (Jam, James) reports the client attended 3 of 4 BIP sessions in October. One absence was excused.' },
    { id: 'n4', date: '10/02/2026', edited: false, text: 'SNAP recertification is due within six weeks. Caseworker to confirm the renewal packet went to the Second Avenue address.' },
    { id: 'n5', date: '09/24/2026', edited: false, text: 'Mercy outpatient team asked to be added to the next case conference invite.' }
  ],

  // due is ISO (yyyy-mm-dd) so it can feed <input type="date">
  actions: [
    { id: 'a1', text: 'Send the meeting summary to the team and confirm the client’s current contact information.', assignee: '[Assignee Name]', due: '2026-10-30', done: false, edited: true },
    { id: 'a2', text: 'Request September and October BIP attendance records from WCS.', assignee: '[Assignee Name]', due: '2026-10-31', done: false, edited: false },
    { id: 'a3', text: 'Confirm the SNAP renewal packet was received.', assignee: '[Assignee Name]', due: '2026-11-20', done: false, edited: false },
    { id: 'a4', text: 'Add the Mercy outpatient team to the next case conference invite.', assignee: '[Assignee Name]', due: '2026-11-14', done: false, edited: false },
    { id: 'a5', text: 'Share the probation officer’s contact details with the housing navigator.', assignee: '[Assignee Name]', due: '2026-10-10', done: true, edited: false },
    { id: 'a6', text: 'Update the client’s emergency contact in ACGO.', assignee: '[Assignee Name]', due: '2026-09-30', done: true, edited: false }
  ]
};
