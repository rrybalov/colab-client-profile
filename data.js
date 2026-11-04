// Sample data for the CoLab client profile prototype.
// Everything here is fictional. Replace with API calls when the backend exists.
window.COLAB_DATA = {
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

  // Signed-in staff member (sample)
  user: { first: 'Logan', last: 'Bialik', initials: 'LB', org: 'DHS', email: 'logan.bialik@alleghenycounty.us' },

  // CoLabs a staff member can belong to. `tag` is the label shown on notes and action items.
  colabs: [
    { id: 'IPV', name: 'IPV CoLab', tag: 'IPV' },
    { id: 'ACGO', name: 'ACGO', tag: 'ACGO' },
    { id: 'Allegheny Go', name: 'Allegheny Go', tag: 'ALLEGHENY GO' },
    { id: 'CYF QA', name: 'CYF QA', tag: 'CYF QA' },
    { id: 'Wellness Checks', name: 'Wellness Checks', tag: 'WELLNESS CHECKS' }
  ],

  // Client index. `starred` is how the current user starred them: 'private', a CoLab id, or null.
  // dob and favorited are mm/dd/yyyy. Every person here is fictional.
  clients: [
    { id: 'c1', first: 'Jimothy', last: 'Jones', dob: '02/09/2000', mci: '1234567890', ssn4: '1234', dhs: '470106828', dpw: '123456778890', phone: '(412) 123-4567', email: 'thisisafakeemail@gmail.com', address: '950 Second Avenue, Pittsburgh, PA 15219', colabs: ['IPV', 'ACGO'], starred: 'IPV', favorited: '01/09/2026' },
    { id: 'c2', first: 'John', last: 'Franklin', dob: '02/09/2000', mci: 'R1234567890', ssn4: '2345', dhs: '470106901', phone: '(412) 234-5678', email: 'jfranklin.sample@gmail.com', address: '1234 Smithfield St, Pittsburgh, PA 15222', colabs: ['ACGO', 'IPV'], starred: 'private', favorited: '01/12/2026' },
    { id: 'c3', first: 'Frank', last: 'Johnson', dob: '06/14/1987', mci: 'R2234567891', ssn4: '8812', dhs: '470118235', phone: '(412) 555-0141', email: 'fjohnson.sample@gmail.com', address: '410 Grant St, Pittsburgh, PA 15219', colabs: ['Allegheny Go'], starred: 'Allegheny Go', favorited: '12/02/2025' },
    { id: 'c4', first: 'Frank', last: 'Tankersley', dob: '11/30/1979', mci: 'R3234567892', ssn4: '4410', dhs: '470122876', phone: '(412) 555-0178', email: 'ftank.sample@gmail.com', address: '77 Penn Ave, Wilkinsburg, PA 15221', colabs: ['CYF QA'], starred: null, favorited: '' },
    { id: 'c5', first: 'Tabitha', last: "O'Connell", dob: '03/22/1995', mci: 'R4234567893', ssn4: '7731', dhs: '470135118', phone: '(412) 555-0110', email: 'toconnell.sample@gmail.com', address: '2200 Wylie Ave, Pittsburgh, PA 15219', colabs: ['IPV'], starred: 'IPV', favorited: '01/02/2026' },
    { id: 'c6', first: 'Applebaum', last: 'Household', household: true, dob: '', mci: 'R5234567894', ssn4: '0391', dhs: '470140027', phone: '(412) 555-0199', email: 'applebaum.sample@gmail.com', address: '5 Hazelwood Ave, Pittsburgh, PA 15207', colabs: ['CYF QA'], starred: 'CYF QA', favorited: '11/18/2025' },
    { id: 'c7', first: 'Maria', last: 'Delgado', dob: '08/05/1990', mci: 'R6234567895', ssn4: '5520', dhs: '470151390', phone: '(412) 555-0122', email: 'mdelgado.sample@gmail.com', address: '318 E Ohio St, Pittsburgh, PA 15212', colabs: ['Wellness Checks'], starred: 'private', favorited: '12/15/2025' },
    { id: 'c8', first: 'Darnell', last: 'Whitaker', dob: '01/17/1968', mci: 'R7234567896', ssn4: '6604', dhs: '470162254', phone: '(412) 555-0133', email: 'dwhitaker.sample@gmail.com', address: '1500 Lincoln Ave, Pittsburgh, PA 15206', colabs: ['IPV', 'Wellness Checks'], starred: 'Wellness Checks', favorited: '10/30/2025' },
    { id: 'c9', first: 'Kayla', last: 'Brennan', dob: '09/09/2004', mci: 'R8234567897', ssn4: '1188', dhs: '470173402', phone: '(412) 555-0144', email: 'kbrennan.sample@gmail.com', address: '64 Main St, Carnegie, PA 15106', colabs: ['Allegheny Go'], starred: null, favorited: '' },
    { id: 'c10', first: 'Okafor', last: 'Household', household: true, dob: '', mci: 'R9234567898', ssn4: '3376', dhs: '470184631', phone: '(412) 555-0155', email: 'okafor.sample@gmail.com', address: '900 Brownsville Rd, Pittsburgh, PA 15210', colabs: ['CYF QA', 'Allegheny Go'], starred: 'private', favorited: '01/05/2026' },
    { id: 'c11', first: 'Luis', last: 'Herrera', dob: '05/26/1983', mci: 'R1034567899', ssn4: '9045', dhs: '470195577', phone: '(412) 555-0166', email: 'lherrera.sample@gmail.com', address: '233 Ohio River Blvd, Bellevue, PA 15202', colabs: ['ACGO'], starred: 'private', favorited: '09/21/2025' },
    { id: 'c12', first: 'Renee', last: 'Washington', dob: '12/01/1958', mci: 'R1134567800', ssn4: '2207', dhs: '470206118', phone: '(412) 555-0177', email: 'rwashington.sample@gmail.com', address: '1700 Centre Ave, Pittsburgh, PA 15219', colabs: ['Wellness Checks'], starred: 'Wellness Checks', favorited: '12/28/2025' },
    { id: 'c13', first: 'Tyler', last: 'Kowalski', dob: '07/30/1999', mci: 'R1234567801', ssn4: '4893', dhs: '470217360', phone: '(412) 555-0188', email: 'tkowalski.sample@gmail.com', address: '412 Fifth Ave, McKeesport, PA 15132', colabs: ['IPV'], starred: null, favorited: '' },
    { id: 'c14', first: 'Aisha', last: 'Rahman', dob: '04/12/1992', mci: 'R1334567802', ssn4: '6152', dhs: '470228471', phone: '(412) 555-0119', email: 'arahman.sample@gmail.com', address: '3800 Forbes Ave, Pittsburgh, PA 15213', colabs: ['ACGO', 'CYF QA'], starred: 'ACGO', favorited: '01/14/2026' },
    { id: 'c15', first: 'Grace', last: 'Nguyen', dob: '10/03/2001', mci: 'R1434567803', ssn4: '7079', dhs: '470239582', phone: '(412) 555-0120', email: 'gnguyen.sample@gmail.com', address: '15 Station St, Bridgeville, PA 15017', colabs: ['Allegheny Go'], starred: 'Allegheny Go', favorited: '11/04/2025' },
    { id: 'c16', first: 'Patrick', last: 'Sullivan', dob: '02/28/1975', mci: 'R1534567804', ssn4: '8136', dhs: '470240693', phone: '(412) 555-0131', email: 'psullivan.sample@gmail.com', address: '601 Broadway Ave, McKees Rocks, PA 15136', colabs: ['IPV'], starred: null, favorited: '' },
    { id: 'c17', first: 'Jasmine', last: 'Carter', dob: '06/19/1997', mci: 'R1634567805', ssn4: '9244', dhs: '470251704', phone: '(412) 555-0142', email: 'jcarter.sample@gmail.com', address: '2100 Murray Ave, Pittsburgh, PA 15217', colabs: ['CYF QA'], starred: 'private', favorited: '10/12/2025' },
    { id: 'c18', first: 'Mohamed', last: 'Abdi', dob: '03/08/1986', mci: 'R1734567806', ssn4: '0351', dhs: '470262815', phone: '(412) 555-0153', email: 'mabdi.sample@gmail.com', address: '19 W 8th Ave, Homestead, PA 15120', colabs: ['ACGO'], starred: null, favorited: '' },
    { id: 'c19', first: 'Bethany', last: 'Price', dob: '09/27/1964', mci: 'R1834567807', ssn4: '1462', dhs: '470273926', phone: '(412) 555-0164', email: 'bprice.sample@gmail.com', address: '480 Lincoln Hwy, North Versailles, PA 15137', colabs: ['Wellness Checks'], starred: 'private', favorited: '08/30/2025' },
    { id: 'c20', first: 'Frankie', last: 'Morales', dob: '12/12/2010', mci: 'R1934567808', ssn4: '2573', dhs: '470284037', phone: '(412) 555-0175', email: 'fmorales.sample@gmail.com', address: '72 Hays Ave, Mount Oliver, PA 15210', colabs: ['CYF QA'], starred: null, favorited: '' },
    { id: 'c21', first: 'Hendricks', last: 'Household', household: true, dob: '', mci: 'R2034567809', ssn4: '3684', dhs: '470295148', phone: '(412) 555-0186', email: 'hendricks.sample@gmail.com', address: '1101 Perrysville Ave, Pittsburgh, PA 15212', colabs: ['IPV', 'CYF QA'], starred: 'IPV', favorited: '12/20/2025' },
    { id: 'c22', first: 'Samuel', last: 'Jones', dob: '08/21/1971', mci: 'R2134567810', ssn4: '4795', dhs: '470306259', phone: '(412) 555-0197', email: 'sjones.sample@gmail.com', address: '305 Allegheny Ave, Oakmont, PA 15139', colabs: ['ACGO'], starred: null, favorited: '' },
    { id: 'c23', first: 'Nadia', last: 'Petrov', dob: '01/04/1993', mci: 'R2234567811', ssn4: '5806', dhs: '470317360', phone: '(412) 555-0108', email: 'npetrov.sample@gmail.com', address: '88 Washington Rd, Mount Lebanon, PA 15228', colabs: ['Allegheny Go', 'Wellness Checks'], starred: 'private', favorited: '01/16/2026' },
    { id: 'c24', first: 'Andre', last: 'Lewis', dob: '05/15/1989', mci: 'R2334567812', ssn4: '6917', dhs: '470328471', phone: '(412) 555-0129', email: 'alewis.sample@gmail.com', address: '722 Hamilton Ave, Pittsburgh, PA 15221', colabs: ['IPV'], starred: null, favorited: '' }
  ],

  // Notes across all of the user's clients. tag is 'PERSONAL' (private to the user) or a CoLab tag.
  notes: [
    { id: 'n1', clientId: 'c1', date: '10/28/2026', edited: true, restricted: true, tag: 'PERSONAL', text: "DA's office confirmed that they will not close out the case until the individual completes BIP. WCS confirmed connecting with the DA's Office about coordinating around this case. Pending are updates needed from DHS about the individual's BIP attendance and engagement." },
    { id: 'n2', clientId: 'c1', date: '10/21/2026', edited: false, restricted: false, tag: 'WELLNESS CHECKS', text: "WCS confirmed it is coordinating with the DA's Office on this case. Next step is a joint call before the November case conference." },
    { id: 'n3', clientId: 'c1', date: '10/14/2026', edited: false, restricted: true, tag: 'IPV', text: 'Probation officer (Jam, James) reports the client attended 3 of 4 BIP sessions in October. One absence was excused.' },
    { id: 'n4', clientId: 'c1', date: '10/02/2026', edited: false, restricted: false, tag: 'ACGO', text: 'SNAP recertification is due within six weeks. Caseworker to confirm the renewal packet went to the Second Avenue address.' },
    { id: 'n5', clientId: 'c1', date: '09/24/2026', edited: false, restricted: false, tag: 'IPV', text: 'Mercy outpatient team asked to be added to the next case conference invite.' },
    { id: 'n6', clientId: 'c1', date: '09/11/2026', edited: true, restricted: true, tag: 'PERSONAL', text: 'Client prefers calls after 3pm. Text first; the voicemail box is often full.' },
    { id: 'n7', clientId: 'c1', date: '08/29/2026', edited: false, restricted: false, tag: 'IPV', text: 'Protection from Abuse order extended through March 2027. Victim services has the updated copy.' },
    { id: 'n8', clientId: 'c1', date: '08/15/2026', edited: false, restricted: true, tag: 'IPV', text: 'Pretrial services confirmed the address on file. No contact condition remains in place.' },
    { id: 'n9', clientId: 'c1', date: '08/01/2026', edited: false, restricted: false, tag: 'ACGO', text: 'Allegheny GO enrollment confirmed. Card mailed to the Second Avenue address.' },
    { id: 'n10', clientId: 'c1', date: '07/18/2026', edited: false, restricted: false, tag: 'WELLNESS CHECKS', text: 'Wellness check completed. Client reports stable housing and regular attendance at outpatient appointments.' },
    { id: 'n11', clientId: 'c1', date: '07/02/2026', edited: false, restricted: true, tag: 'PERSONAL', text: 'Follow up on whether the employer letter for the Medicaid renewal was submitted.' },
    { id: 'n12', clientId: 'c1', date: '06/20/2026', edited: false, restricted: false, tag: 'IPV', text: 'Case conference held with WCS, probation and DHS. Next review set for September.' },
    { id: 'n13', clientId: 'c5', date: '10/26/2026', edited: false, restricted: true, tag: 'IPV', text: 'Child Welfare alerted to the IPV situation. Caseworker will reach out about safety planning this week.' },
    { id: 'n14', clientId: 'c5', date: '10/09/2026', edited: true, restricted: false, tag: 'IPV', text: 'Shelter bed confirmed through the end of the month. Transportation arranged for the intake appointment.' },
    { id: 'n15', clientId: 'c6', date: '10/25/2026', edited: false, restricted: false, tag: 'CYF QA', text: 'Family connected with Hello Baby. First home visit scheduled for next Tuesday.' },
    { id: 'n16', clientId: 'c6', date: '09/30/2026', edited: false, restricted: true, tag: 'PERSONAL', text: 'Mother asked that mail go to the grandmother’s address until the move is final.' },
    { id: 'n17', clientId: 'c2', date: '10/24/2026', edited: false, restricted: false, tag: 'ACGO', text: 'Benefits screen completed. Eligible for LIHEAP; referred to the energy assistance line.' },
    { id: 'n18', clientId: 'c2', date: '09/17/2026', edited: false, restricted: true, tag: 'IPV', text: 'Court date moved to December 3. Client notified by phone.' },
    { id: 'n19', clientId: 'c8', date: '10/22/2026', edited: false, restricted: false, tag: 'WELLNESS CHECKS', text: 'Wellness check by phone. Client is out of blood pressure medication; pharmacy refill requested.' },
    { id: 'n20', clientId: 'c8', date: '10/01/2026', edited: true, restricted: false, tag: 'IPV', text: 'Client completed week 12 of BIP. Facilitator reports good participation.' },
    { id: 'n21', clientId: 'c12', date: '10/20/2026', edited: false, restricted: false, tag: 'WELLNESS CHECKS', text: 'Daughter is now the emergency contact. Updated in ACGO.' },
    { id: 'n22', clientId: 'c14', date: '10/18/2026', edited: false, restricted: true, tag: 'PERSONAL', text: 'Interpreter (Bengali) needed for every call. Language line works best.' },
    { id: 'n23', clientId: 'c21', date: '10/16/2026', edited: false, restricted: true, tag: 'CYF QA', text: 'QA review flagged a missing safety assessment on the September visit. Supervisor notified.' },
    { id: 'n24', clientId: 'c7', date: '10/12/2026', edited: false, restricted: false, tag: 'WELLNESS CHECKS', text: 'Client asked about rental assistance. Gave the Allegheny Link number and logged the call.' },
    { id: 'n25', clientId: 'c3', date: '10/08/2026', edited: false, restricted: false, tag: 'ALLEGHENY GO', text: 'Allegheny GO card reported lost. Replacement requested.' },
    { id: 'n26', clientId: 'c10', date: '10/05/2026', edited: false, restricted: true, tag: 'CYF QA', text: 'Both children now enrolled at the same school. Transportation plan confirmed with the district.' },
    { id: 'n27', clientId: 'c23', date: '09/28/2026', edited: false, restricted: false, tag: 'PERSONAL', text: 'Check in after the October 15 housing inspection.' },
    { id: 'n28', clientId: 'c15', date: '09/19/2026', edited: false, restricted: false, tag: 'ALLEGHENY GO', text: 'Enrollment renewed for another year. No changes to household size.' }
  ],

  // Action items across all of the user's clients. due is ISO (yyyy-mm-dd) so it can feed <input type="date">.
  actions: [
    { id: 'a1', clientId: 'c1', tag: 'IPV', text: 'Review updated summary from meeting, collect client info and email it out to the team', assignee: '[Assignee Name]', due: '2026-10-30', done: false, edited: true },
    { id: 'a2', clientId: 'c1', tag: 'WELLNESS CHECKS', text: 'Call PO and fill them in on updates', assignee: '[Assignee Name]', due: '2026-10-31', done: false, edited: false },
    { id: 'a3', clientId: 'c6', tag: 'CYF QA', text: 'Connect victim to Hello Baby', assignee: '[Assignee Name]', due: '2026-11-02', done: false, edited: false },
    { id: 'a4', clientId: 'c1', tag: 'PERSONAL', text: 'Pretrial to contact defendant about no contact and confirm his address; DHS will reach out to CYF about messaging to the family', assignee: '[Assignee Name]', due: '2026-11-14', done: false, edited: false },
    { id: 'a5', clientId: 'c5', tag: 'IPV', text: 'Alert Child Welfare about IPV situation, encourage messaging', assignee: '[Assignee Name]', due: '2026-11-06', done: false, edited: false },
    { id: 'a6', clientId: 'c1', tag: 'ACGO', text: 'Confirm the SNAP renewal packet was received', assignee: '[Assignee Name]', due: '2026-11-20', done: false, edited: false },
    { id: 'a7', clientId: 'c1', tag: 'PERSONAL', text: 'Request September and October BIP attendance records from WCS', assignee: '[Assignee Name]', due: '2026-11-10', done: false, edited: false },
    { id: 'a8', clientId: 'c1', tag: 'IPV', text: 'Share the probation officer’s contact details with the housing navigator', assignee: '[Assignee Name]', due: '2026-10-10', done: true, edited: false },
    { id: 'a9', clientId: 'c1', tag: 'ACGO', text: 'Update the client’s emergency contact in ACGO', assignee: '[Assignee Name]', due: '2026-09-30', done: true, edited: false },
    { id: 'a10', clientId: 'c2', tag: 'ACGO', text: 'Send LIHEAP application checklist to the client', assignee: '[Assignee Name]', due: '2026-11-12', done: false, edited: false },
    { id: 'a11', clientId: 'c2', tag: 'IPV', text: 'Remind client of the December 3 court date', assignee: '[Assignee Name]', due: '2026-11-28', done: false, edited: false },
    { id: 'a12', clientId: 'c8', tag: 'WELLNESS CHECKS', text: 'Confirm the blood pressure prescription was picked up', assignee: '[Assignee Name]', due: '2026-10-29', done: false, edited: false },
    { id: 'a13', clientId: 'c12', tag: 'WELLNESS CHECKS', text: 'Schedule the next wellness check by phone', assignee: '[Assignee Name]', due: '2026-11-18', done: false, edited: false },
    { id: 'a14', clientId: 'c14', tag: 'PERSONAL', text: 'Book a Bengali interpreter for the next call', assignee: '[Assignee Name]', due: '2026-11-09', done: false, edited: false },
    { id: 'a15', clientId: 'c21', tag: 'CYF QA', text: 'Add the missing safety assessment to the September visit record', assignee: '[Assignee Name]', due: '2026-11-04', done: false, edited: true },
    { id: 'a16', clientId: 'c7', tag: 'WELLNESS CHECKS', text: 'Follow up on the Allegheny Link rental assistance call', assignee: '[Assignee Name]', due: '2026-11-16', done: false, edited: false },
    { id: 'a17', clientId: 'c3', tag: 'ALLEGHENY GO', text: 'Confirm the replacement Allegheny GO card arrived', assignee: '[Assignee Name]', due: '2026-11-21', done: false, edited: false },
    { id: 'a18', clientId: 'c10', tag: 'CYF QA', text: 'Check the transportation plan with the school district', assignee: '[Assignee Name]', due: '2026-10-20', done: true, edited: false },
    { id: 'a19', clientId: 'c23', tag: 'PERSONAL', text: 'Call after the October 15 housing inspection', assignee: '[Assignee Name]', due: '2026-10-17', done: true, edited: false },
    { id: 'a20', clientId: 'c15', tag: 'ALLEGHENY GO', text: 'File the renewed enrollment confirmation', assignee: '[Assignee Name]', due: '2026-09-25', done: true, edited: false },
    { id: 'a21', clientId: 'c5', tag: 'IPV', text: 'Arrange transportation for the shelter intake appointment', assignee: '[Assignee Name]', due: '2026-10-12', done: true, edited: false },
    { id: 'a22', clientId: 'c6', tag: 'PERSONAL', text: 'Update the mailing address once the family’s move is final', assignee: '[Assignee Name]', due: '2026-11-30', done: false, edited: false }
  ]
};
