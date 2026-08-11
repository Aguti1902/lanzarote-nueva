// Merge Port dossier (company+code) with Ship schedule (name+times)
const dossier = `12-Sep-26 Saturday LANZAROTE PORT Swan Hellenic SDN
20-Sep-26 Sunday LANZAROTE PORT P&O Cruises PVE
7-Oct-26 Wednesday LANZAROTE PORT P&O Cruises PVE
10-Oct-26 Saturday LANZAROTE PORT P&O Cruises PON
11-Oct-26 Sunday LANZAROTE PORT MSC MVI
15-Oct-26 Thursday LANZAROTE PORT P&O Cruises PAZ
23-Oct-26 Friday LANZAROTE PORT Norwegian Cruise Line NST
24-Oct-26 Saturday LANZAROTE PORT P&O Cruises PBR
25-Oct-26 Sunday LANZAROTE PORT Hapag Lloyd HLE
26-Oct-26 Monday LANZAROTE PORT Compagnie du Ponant PLA
29-Oct-26 Thursday LANZAROTE PORT P&O Cruises PAZ
2-Nov-26 Monday LANZAROTE PORT Compagnie du Ponant PLA
3-Nov-26 Tuesday LANZAROTE PORT Compagnie du Ponant PLA
3-Nov-26 Tuesday LANZAROTE PORT TUI Cruises TM7
4-Nov-26 Wednesday LANZAROTE PORT TUI Cruises TM7
4-Nov-26 Wednesday LANZAROTE PORT Sea Cloud Cruises SC2
4-Nov-26 Wednesday LANZAROTE PORT Norwegian Cruise Line NST
5-Nov-26 Thursday LANZAROTE PORT TUI Cruises TM3
5-Nov-26 Thursday LANZAROTE PORT P&O Cruises PAR
6-Nov-26 Friday LANZAROTE PORT Oceania Cruises ORE
7-Nov-26 Saturday LANZAROTE PORT AIDA Cruises ABL
8-Nov-26 Sunday LANZAROTE PORT P&O Cruises PVE
11-Nov-26 Wednesday LANZAROTE PORT Sea Cloud Cruises SCS
11-Nov-26 Wednesday LANZAROTE PORT Oceania Cruises OIN
11-Nov-26 Wednesday LANZAROTE PORT Star Clippers SSF
12-Nov-26 Thursday LANZAROTE PORT Sea Cloud Cruises SCS
12-Nov-26 Thursday LANZAROTE PORT P&O Cruises PAZ
13-Nov-26 Friday LANZAROTE PORT AIDA Cruises APE
13-Nov-26 Friday LANZAROTE PORT AIDA Cruises APM
13-Nov-26 Friday LANZAROTE PORT Compagnie du Ponant PLU
14-Nov-26 Saturday LANZAROTE PORT P&O Cruises PON
14-Nov-26 Saturday LANZAROTE PORT TUI Cruises TMR
15-Nov-26 Sunday LANZAROTE PORT TUI Cruises TM7
16-Nov-26 Monday LANZAROTE PORT TUI Cruises TM7
16-Nov-26 Monday LANZAROTE PORT AIDA Cruises ABL
16-Nov-26 Monday LANZAROTE PORT Compagnie du Ponant PLU
17-Nov-26 Tuesday LANZAROTE PORT Compagnie du Ponant PLU
17-Nov-26 Tuesday LANZAROTE PORT Cunard CQV
17-Nov-26 Tuesday LANZAROTE PORT Celebrity Cruises CIN
18-Nov-26 Wednesday LANZAROTE PORT Marella Cruises TD2
18-Nov-26 Wednesday LANZAROTE PORT Regent RNV
18-Nov-26 Wednesday LANZAROTE PORT Star Clippers SSL
18-Nov-26 Wednesday LANZAROTE PORT WindStar Cruises WSP
19-Nov-26 Thursday LANZAROTE PORT Hapag Lloyd HLU
20-Nov-26 Friday LANZAROTE PORT AIDA Cruises APM
21-Nov-26 Saturday LANZAROTE PORT TUI Cruises TMR
22-Nov-26 Sunday LANZAROTE PORT Oceania Cruises OAA
22-Nov-26 Sunday LANZAROTE PORT Marella Cruises TD2
24-Nov-26 Tuesday LANZAROTE PORT P&O Cruises PVE
25-Nov-26 Wednesday LANZAROTE PORT Costa Cruises CSM
26-Nov-26 Thursday LANZAROTE PORT P&O Cruises PAZ
27-Nov-26 Friday LANZAROTE PORT AIDA Cruises APM
28-Nov-26 Saturday LANZAROTE PORT P&O Cruises PON
28-Nov-26 Saturday LANZAROTE PORT TUI Cruises TMR
29-Nov-26 Sunday LANZAROTE PORT Regent RNV
29-Nov-26 Sunday LANZAROTE PORT Fred Olsen Cruises FBS
29-Nov-26 Sunday LANZAROTE PORT Marella Cruises TD2
29-Nov-26 Sunday LANZAROTE PORT TUI Cruises TM7
30-Nov-26 Monday LANZAROTE PORT TUI Cruises TM7
30-Nov-26 Monday LANZAROTE PORT Fred Olsen Cruises FBB
2-Dec-26 Wednesday LANZAROTE PORT Costa Cruises CSM
2-Dec-26 Wednesday LANZAROTE PORT Fred Olsen Cruises FBA
2-Dec-26 Wednesday LANZAROTE PORT Compagnie du Ponant PLC
3-Dec-26 Thursday LANZAROTE PORT AIDA Cruises ABL
4-Dec-26 Friday LANZAROTE PORT Celebrity Cruises CIN
4-Dec-26 Friday LANZAROTE PORT Compagnie du Ponant PLC
4-Dec-26 Friday LANZAROTE PORT AIDA Cruises APM
5-Dec-26 Saturday LANZAROTE PORT TUI Cruises TMR
6-Dec-26 Sunday LANZAROTE PORT AIDA Cruises APM
6-Dec-26 Sunday LANZAROTE PORT Marella Cruises ME1
7-Dec-26 Monday LANZAROTE PORT Cunard CQA
7-Dec-26 Monday LANZAROTE PORT Marella Cruises TD2
8-Dec-26 Tuesday LANZAROTE PORT Costa Cruises CSM
10-Dec-26 Thursday LANZAROTE PORT P&O Cruises PAZ
11-Dec-26 Friday LANZAROTE PORT AIDA Cruises ACM
11-Dec-26 Friday LANZAROTE PORT Cunard CQV
12-Dec-26 Saturday LANZAROTE PORT P&O Cruises PON
12-Dec-26 Saturday LANZAROTE PORT TUI Cruises TMR
13-Dec-26 Sunday LANZAROTE PORT Marella Cruises ME1
13-Dec-26 Sunday LANZAROTE PORT Marella Cruises TD2
14-Dec-26 Monday LANZAROTE PORT P&O Cruises PAR
14-Dec-26 Monday LANZAROTE PORT P&O Cruises PVE
15-Dec-26 Tuesday LANZAROTE PORT AIDA Cruises ABL
15-Dec-26 Tuesday LANZAROTE PORT Explora Journeys EX2
15-Dec-26 Tuesday LANZAROTE PORT Oceania Cruises OSI
16-Dec-26 Wednesday LANZAROTE PORT Celebrity Cruises CIN
16-Dec-26 Wednesday LANZAROTE PORT WindStar Cruises WSP
17-Dec-26 Thursday LANZAROTE PORT MSC MFA
18-Dec-26 Friday LANZAROTE PORT AIDA Cruises ACM
18-Dec-26 Friday LANZAROTE PORT TUI Cruises TM7
18-Dec-26 Friday LANZAROTE PORT WindStar Cruises WSP
19-Dec-26 Saturday LANZAROTE PORT TUI Cruises TMR
20-Dec-26 Sunday LANZAROTE PORT Marella Cruises ME1
20-Dec-26 Sunday LANZAROTE PORT Marella Cruises TD2
22-Dec-26 Tuesday LANZAROTE PORT Costa Cruises CSM
23-Dec-26 Wednesday LANZAROTE PORT Marella Cruises ME1
23-Dec-26 Wednesday LANZAROTE PORT Celebrity Cruises CIN
24-Dec-26 Thursday LANZAROTE PORT Cunard CQV
24-Dec-26 Thursday LANZAROTE PORT MSC MFA
25-Dec-26 Friday LANZAROTE PORT AIDA Cruises ACM
26-Dec-26 Saturday LANZAROTE PORT Cunard CQA
26-Dec-26 Saturday LANZAROTE PORT TUI Cruises TMR
27-Dec-26 Sunday LANZAROTE PORT P&O Cruises PAR
28-Dec-26 Monday LANZAROTE PORT P&O Cruises PON
28-Dec-26 Monday LANZAROTE PORT WindStar Cruises WSP
29-Dec-26 Tuesday LANZAROTE PORT P&O Cruises PVE
29-Dec-26 Tuesday LANZAROTE PORT Costa Cruises CSM
30-Dec-26 Wednesday LANZAROTE PORT AIDA Cruises ALU
30-Dec-26 Wednesday LANZAROTE PORT Marella Cruises TD2
31-Dec-26 Thursday LANZAROTE PORT AIDA Cruises ABL
31-Dec-26 Thursday LANZAROTE PORT MSC MFA
1-Jan-27 Friday LANZAROTE PORT AIDA Cruises ACM
2-Jan-27 Saturday LANZAROTE PORT TUI Cruises TMR
3-Jan-27 Sunday LANZAROTE PORT Marella Cruises TD2
4-Jan-27 Monday LANZAROTE PORT TUI Cruises TM3
5-Jan-27 Tuesday LANZAROTE PORT TUI Cruises TM7
6-Jan-27 Wednesday LANZAROTE PORT TUI Cruises TM7
6-Jan-27 Wednesday LANZAROTE PORT Costa Cruises CSM
6-Jan-27 Wednesday LANZAROTE PORT P&O Cruises PAZ
7-Jan-27 Thursday LANZAROTE PORT Costa Cruises CSM
7-Jan-27 Thursday LANZAROTE PORT MSC MFA
7-Jan-27 Thursday LANZAROTE PORT WindStar Cruises WSP
8-Jan-27 Friday LANZAROTE PORT AIDA Cruises ACM
9-Jan-27 Saturday LANZAROTE PORT Marella Cruises ME1
9-Jan-27 Saturday LANZAROTE PORT TUI Cruises TMR
10-Jan-27 Sunday LANZAROTE PORT Celebrity Cruises CIN
10-Jan-27 Sunday LANZAROTE PORT Marella Cruises TD2
12-Jan-27 Tuesday LANZAROTE PORT AIDA Cruises ABL
12-Jan-27 Tuesday LANZAROTE PORT P&O Cruises PVE
14-Jan-27 Thursday LANZAROTE PORT Costa Cruises CSM
14-Jan-27 Thursday LANZAROTE PORT MSC MFA
15-Jan-27 Friday LANZAROTE PORT AIDA Cruises ACM
16-Jan-27 Saturday LANZAROTE PORT Marella Cruises ME1
16-Jan-27 Saturday LANZAROTE PORT TUI Cruises TMR
17-Jan-27 Sunday LANZAROTE PORT Marella Cruises TD2
17-Jan-27 Sunday LANZAROTE PORT Celebrity Cruises CIN
18-Jan-27 Monday LANZAROTE PORT AIDA Cruises ABL
19-Jan-27 Tuesday LANZAROTE PORT AIDA Cruises APM
21-Jan-27 Thursday LANZAROTE PORT MSC MFA
21-Jan-27 Thursday LANZAROTE PORT P&O Cruises PAZ
21-Jan-27 Thursday LANZAROTE PORT AIDA Cruises AMA
22-Jan-27 Friday LANZAROTE PORT AIDA Cruises ACM
23-Jan-27 Saturday LANZAROTE PORT Marella Cruises ME1
23-Jan-27 Saturday LANZAROTE PORT Cunard CQE
23-Jan-27 Saturday LANZAROTE PORT TUI Cruises TMR
24-Jan-27 Sunday LANZAROTE PORT P&O Cruises PAZ
24-Jan-27 Sunday LANZAROTE PORT Marella Cruises TD2
24-Jan-27 Sunday LANZAROTE PORT TUI Cruises TM7
25-Jan-27 Monday LANZAROTE PORT TUI Cruises TM7
25-Jan-27 Monday LANZAROTE PORT WindStar Cruises WSP
26-Jan-27 Tuesday LANZAROTE PORT Costa Cruises CSM
28-Jan-27 Thursday LANZAROTE PORT AIDA Cruises AMA
28-Jan-27 Thursday LANZAROTE PORT MSC MFA
29-Jan-27 Friday LANZAROTE PORT AIDA Cruises ACM
30-Jan-27 Saturday LANZAROTE PORT Celebrity Cruises CIN
30-Jan-27 Saturday LANZAROTE PORT Marella Cruises ME1
30-Jan-27 Saturday LANZAROTE PORT TUI Cruises TMR
31-Jan-27 Sunday LANZAROTE PORT Marella Cruises TD2
2-Feb-27 Tuesday LANZAROTE PORT P&O Cruises PVE
2-Feb-27 Tuesday LANZAROTE PORT Costa Cruises CSM
3-Feb-27 Wednesday LANZAROTE PORT Costa Cruises CSM
4-Feb-27 Thursday LANZAROTE PORT MSC MFA
4-Feb-27 Thursday LANZAROTE PORT P&O Cruises PAZ
5-Feb-27 Friday LANZAROTE PORT AIDA Cruises ACM
6-Feb-27 Saturday LANZAROTE PORT Costa Cruises CSM
6-Feb-27 Saturday LANZAROTE PORT Marella Cruises MV1
6-Feb-27 Saturday LANZAROTE PORT TUI Cruises TMR
7-Feb-27 Sunday LANZAROTE PORT Marella Cruises TD2
7-Feb-27 Sunday LANZAROTE PORT TUI Cruises TM7
8-Feb-27 Monday LANZAROTE PORT TUI Cruises TM7
9-Feb-27 Tuesday LANZAROTE PORT AIDA Cruises AMA
11-Feb-27 Thursday LANZAROTE PORT Celebrity Cruises CIN
11-Feb-27 Thursday LANZAROTE PORT Cunard CQE
11-Feb-27 Thursday LANZAROTE PORT MSC MFA
12-Feb-27 Friday LANZAROTE PORT AIDA Cruises ACM
13-Feb-27 Saturday LANZAROTE PORT Costa Cruises CSM
13-Feb-27 Saturday LANZAROTE PORT Marella Cruises ME1
13-Feb-27 Saturday LANZAROTE PORT TUI Cruises TMR
14-Feb-27 Sunday LANZAROTE PORT Marella Cruises TD2
17-Feb-27 Wednesday LANZAROTE PORT Explora Journeys EX2
17-Feb-27 Wednesday LANZAROTE PORT MSC MFA
18-Feb-27 Thursday LANZAROTE PORT P&O Cruises PAZ
18-Feb-27 Thursday LANZAROTE PORT P&O Cruises PVE
19-Feb-27 Friday LANZAROTE PORT AIDA Cruises ACM
20-Feb-27 Saturday LANZAROTE PORT Costa Cruises CSM
20-Feb-27 Saturday LANZAROTE PORT Marella Cruises ME1
20-Feb-27 Saturday LANZAROTE PORT TUI Cruises TMR
21-Feb-27 Sunday LANZAROTE PORT Marella Cruises TD2
21-Feb-27 Sunday LANZAROTE PORT TUI Cruises TM7
22-Feb-27 Monday LANZAROTE PORT TUI Cruises TM7
22-Feb-27 Monday LANZAROTE PORT Celebrity Cruises CIN
25-Feb-27 Thursday LANZAROTE PORT Princess Cruises PMJ
25-Feb-27 Thursday LANZAROTE PORT AIDA Cruises AMA
25-Feb-27 Thursday LANZAROTE PORT MSC MFA
26-Feb-27 Friday LANZAROTE PORT AIDA Cruises ACM
27-Feb-27 Saturday LANZAROTE PORT Costa Cruises CSM
27-Feb-27 Saturday LANZAROTE PORT TUI Cruises TMR
28-Feb-27 Sunday LANZAROTE PORT Marella Cruises ME1
28-Feb-27 Sunday LANZAROTE PORT Oceania Cruises OSI
28-Feb-27 Sunday LANZAROTE PORT Marella Cruises TD2
4-Mar-27 Thursday LANZAROTE PORT MSC MFA
4-Mar-27 Thursday LANZAROTE PORT P&O Cruises PAZ
5-Mar-27 Friday LANZAROTE PORT AIDA Cruises ACM
6-Mar-27 Saturday LANZAROTE PORT P&O Cruises PON
6-Mar-27 Saturday LANZAROTE PORT Marella Cruises ME1
6-Mar-27 Saturday LANZAROTE PORT Celebrity Cruises CIN
7-Mar-27 Sunday LANZAROTE PORT Marella Cruises TD2
8-Mar-27 Monday LANZAROTE PORT AIDA Cruises AMA
9-Mar-27 Tuesday LANZAROTE PORT AIDA Cruises AMA
9-Mar-27 Tuesday LANZAROTE PORT Cunard CQM
11-Mar-27 Thursday LANZAROTE PORT Costa Cruises CSM
11-Mar-27 Thursday LANZAROTE PORT MSC MFA
12-Mar-27 Friday LANZAROTE PORT AIDA Cruises ACM
13-Mar-27 Saturday LANZAROTE PORT Costa Cruises CSM
13-Mar-27 Saturday LANZAROTE PORT Marella Cruises ME1
13-Mar-27 Saturday LANZAROTE PORT TUI Cruises TMR
14-Mar-27 Sunday LANZAROTE PORT Marella Cruises TD2
16-Mar-27 Tuesday LANZAROTE PORT TUI Cruises TM7
17-Mar-27 Wednesday LANZAROTE PORT TUI Cruises TM7
18-Mar-27 Thursday LANZAROTE PORT MSC MFA
18-Mar-27 Thursday LANZAROTE PORT P&O Cruises PAZ
19-Mar-27 Friday LANZAROTE PORT AIDA Cruises ACM
20-Mar-27 Saturday LANZAROTE PORT P&O Cruises PON
20-Mar-27 Saturday LANZAROTE PORT Marella Cruises ME1
20-Mar-27 Saturday LANZAROTE PORT TUI Cruises TMR
21-Mar-27 Sunday LANZAROTE PORT Marella Cruises TD2
25-Mar-27 Thursday LANZAROTE PORT AIDA Cruises AMA
25-Mar-27 Thursday LANZAROTE PORT Costa Cruises CSM
25-Mar-27 Thursday LANZAROTE PORT MSC MFA
26-Mar-27 Friday LANZAROTE PORT AIDA Cruises ACM
26-Mar-27 Friday LANZAROTE PORT P&O Cruises PVE
27-Mar-27 Saturday LANZAROTE PORT Marella Cruises ME1
27-Mar-27 Saturday LANZAROTE PORT TUI Cruises TMR
30-Mar-27 Tuesday LANZAROTE PORT Costa Cruises CSM
1-Apr-27 Thursday LANZAROTE PORT MSC MFA
2-Apr-27 Friday LANZAROTE PORT AIDA Cruises ACM
3-Apr-27 Saturday LANZAROTE PORT Marella Cruises ME1
3-Apr-27 Saturday LANZAROTE PORT TUI Cruises TMR
4-Apr-27 Sunday LANZAROTE PORT TUI Cruises TM7
5-Apr-27 Monday LANZAROTE PORT TUI Cruises TM7
5-Apr-27 Monday LANZAROTE PORT MSC MFA
6-Apr-27 Tuesday LANZAROTE PORT AIDA Cruises AMA
8-Apr-27 Thursday LANZAROTE PORT Atlas Ocean Voyages AWV
9-Apr-27 Friday LANZAROTE PORT AIDA Cruises ACM
9-Apr-27 Friday LANZAROTE PORT Compagnie du Ponant PLE
9-Apr-27 Friday LANZAROTE PORT TUI Cruises TM7
10-Apr-27 Saturday LANZAROTE PORT Marella Cruises ME1
10-Apr-27 Saturday LANZAROTE PORT Compagnie du Ponant PLB
10-Apr-27 Saturday LANZAROTE PORT TUI Cruises TMR
11-Apr-27 Sunday LANZAROTE PORT P&O Cruises PVE
13-Apr-27 Tuesday LANZAROTE PORT Regent RVO
15-Apr-27 Thursday LANZAROTE PORT Norwegian Cruise Line NST
16-Apr-27 Friday LANZAROTE PORT AIDA Cruises ACM
17-Apr-27 Saturday LANZAROTE PORT Marella Cruises ME1
17-Apr-27 Saturday LANZAROTE PORT Atlas Ocean Voyages AWT
17-Apr-27 Saturday LANZAROTE PORT TUI Cruises TMR
20-Apr-27 Tuesday LANZAROTE PORT Oceania Cruises OIN
21-Apr-27 Wednesday LANZAROTE PORT Cunard CQE
22-Apr-27 Thursday LANZAROTE PORT Seabourn SVE
23-Apr-27 Friday LANZAROTE PORT AIDA Cruises ACM
24-Apr-27 Saturday LANZAROTE PORT Marella Cruises ME1
24-Apr-27 Saturday LANZAROTE PORT TUI Cruises TMR
25-Apr-27 Sunday LANZAROTE PORT AIDA Cruises ACM
25-Apr-27 Sunday LANZAROTE PORT P&O Cruises PVE
26-Apr-27 Monday LANZAROTE PORT Atlas Ocean Voyages AWN
28-Apr-27 Wednesday LANZAROTE PORT Marella Cruises ME1
29-Apr-27 Thursday LANZAROTE PORT Atlas Ocean Voyages AWN
29-Apr-27 Thursday LANZAROTE PORT Hapag Lloyd HLN`;

const ships = `SH Diana 12/09/2026 12:00 23:59
Ventura 20/09/2026 08:00 18:00
Ventura 07/10/2026 09:00 18:00
Iona 10/10/2026 07:00 18:00
Virtuosa 11/10/2026 07:00 14:00
Azura 15/10/2026 08:00 17:00
Norwegian Star 23/10/2026 07:00 17:00
Britannia 24/10/2026 08:00 18:00
Europa 2 25/10/2026 08:00 19:00
Le Laperouse 26/10/2026 06:00 18:00
Azura 29/10/2026 09:30 18:00
Le Laperouse 02/11/2026 22:15 23:59
Le Laperouse 03/11/2026 00:00 18:30
Mein Schiff 7 03/11/2026 19:00 23:59
Mein Schiff 7 04/11/2026 00:00 18:00
Sea Cloud II 04/11/2026 07:00 14:00
Norwegian Star 04/11/2026 10:30 20:00
Mein Schiff 3 05/11/2026 08:00 19:00
Arcadia 05/11/2026 09:00 17:00
Regatta 06/11/2026 10:00 18:00
AIDABlu 07/11/2026 08:00 18:00
Ventura 08/11/2026 08:00 17:00
Sea Cloud Spirit 11/11/2026 08:00 23:59
Insignia 11/11/2026 10:00 18:00
Star Flyer 11/11/2026 10:00 15:00
Sea Cloud Spirit 12/11/2026 00:00 10:00
Azura 12/11/2026 08:00 17:00
AIDAPerla 13/11/2026 09:30 19:00
AIDAPrima 13/11/2026 11:00 20:00
Le Dumont-d'Urville 13/11/2026 13:30 18:30
Iona 14/11/2026 07:00 18:00
Mein Schiff Relax 14/11/2026 09:00 19:00
Mein Schiff 7 15/11/2026 19:00 23:59
Mein Schiff 7 16/11/2026 00:00 18:00
AIDABlu 16/11/2026 08:00 17:00
Le Dumont-d'Urville 16/11/2026 22:15 23:59
Le Dumont-d'Urville 17/11/2026 00:00 18:30
Queen Victoria 17/11/2026 09:00 23:59
Infinity 17/11/2026 11:00 20:00
Marella Discovery 2 18/11/2026 09:00 18:00
Seven Seas Navigator 18/11/2026 09:30 18:00
Star Clipper 18/11/2026 10:00 15:00
Wind Spirit 18/11/2026 11:00 17:00
Europa 19/11/2026 07:00 18:00
AIDAPrima 20/11/2026 07:30 19:00
Mein Schiff Relax 21/11/2026 09:00 19:00
Allura 22/11/2026 07:00 13:00
Marella Discovery 2 22/11/2026 09:00 18:00
Ventura 24/11/2026 08:00 17:00
Costa Smeralda 25/11/2026 08:00 18:00
Azura 26/11/2026 08:00 17:00
AIDAPrima 27/11/2026 07:30 19:00
Iona 28/11/2026 07:00 18:00
Mein Schiff Relax 28/11/2026 09:00 19:00
Seven Seas Navigator 29/11/2026 08:00 18:00
Borealis 29/11/2026 08:30 17:30
Marella Discovery 2 29/11/2026 09:00 18:00
Mein Schiff 7 29/11/2026 19:00 23:59
Mein Schiff 7 30/11/2026 00:00 18:00
Bolette 30/11/2026 08:30 23:00
Costa Smeralda 02/12/2026 08:00 18:00
Balmoral 02/12/2026 08:00 16:00
Le Champlain 02/12/2026 13:30 19:00
AIDABlu 03/12/2026 08:00 18:00
Infinity 04/12/2026 07:00 17:00
Le Champlain 04/12/2026 07:00 23:59
AIDAPrima 04/12/2026 07:30 19:00
Mein Schiff Relax 05/12/2026 09:00 19:00
AIDAPrima 06/12/2026 08:00 17:00
Marella Explorer 1 06/12/2026 08:00 18:00
Queen Anne 07/12/2026 08:00 17:00
Marella Discovery 2 07/12/2026 09:00 18:00
Costa Smeralda 08/12/2026 09:00 20:00
Azura 10/12/2026 08:00 17:00
AIDAcosma 11/12/2026 07:30 19:00
Queen Victoria 11/12/2026 08:00 17:00
Iona 12/12/2026 07:00 18:00
Mein Schiff Relax 12/12/2026 09:00 19:00
Marella Explorer 1 13/12/2026 08:00 18:00
Marella Discovery 2 13/12/2026 09:00 18:00
Arcadia 14/12/2026 08:00 17:00
Ventura 14/12/2026 08:00 17:00
AIDABlu 15/12/2026 08:00 17:00
Explora 2 15/12/2026 09:00 19:00
Sirena 15/12/2026 10:00 18:00
Infinity 16/12/2026 07:00 17:00
Wind Spirit 16/12/2026 08:00 13:00
Fantasia 17/12/2026 08:00 18:00
AIDAcosma 18/12/2026 07:30 19:00
Mein Schiff 7 18/12/2026 08:00 19:00
Wind Spirit 18/12/2026 11:00 17:00
Mein Schiff Relax 19/12/2026 09:00 19:00
Marella Explorer 1 20/12/2026 08:00 18:00
Marella Discovery 2 20/12/2026 09:00 18:00
Costa Smeralda 22/12/2026 09:00 20:00
Marella Explorer 1 23/12/2026 10:00 19:00
Infinity 23/12/2026 11:00 20:00
Queen Victoria 24/12/2026 08:00 17:00
Fantasia 24/12/2026 08:00 18:00
AIDAcosma 25/12/2026 07:30 19:00
Queen Anne 26/12/2026 07:00 21:00
Mein Schiff Relax 26/12/2026 09:00 19:00
Arcadia 27/12/2026 09:00 17:00
Iona 28/12/2026 07:00 18:00
Wind Spirit 28/12/2026 11:00 17:00
Ventura 29/12/2026 08:00 18:00
Costa Smeralda 29/12/2026 09:00 20:00
AIDALuna 30/12/2026 08:00 18:00
Marella Discovery 2 30/12/2026 08:00 18:00
AIDABlu 31/12/2026 08:00 18:00
Fantasia 31/12/2026 08:00 18:00
AIDAcosma 01/01/2027 07:30 19:00
Mein Schiff Relax 02/01/2027 09:00 19:00
Marella Discovery 2 03/01/2027 08:00 17:00
Mein Schiff 3 04/01/2027 08:00 19:00
Mein Schiff 7 05/01/2027 19:00 23:59
Mein Schiff 7 06/01/2027 00:00 18:00
Costa Smeralda 06/01/2027 08:00 23:59
Azura 06/01/2027 09:00 18:00
Costa Smeralda 07/01/2027 00:00 18:00
Fantasia 07/01/2027 08:00 18:00
Wind Spirit 07/01/2027 11:00 17:00
AIDAcosma 08/01/2027 07:30 19:00
Marella Explorer 1 09/01/2027 08:00 18:00
Mein Schiff Relax 09/01/2027 09:00 19:00
Infinity 10/01/2027 07:00 17:00
Marella Discovery 2 10/01/2027 09:00 18:00
AIDABlu 12/01/2027 08:00 17:00
Ventura 12/01/2027 08:00 17:00
Costa Smeralda 14/01/2027 08:00 18:00
Fantasia 14/01/2027 08:00 18:00
AIDAcosma 15/01/2027 07:30 19:00
Marella Explorer 1 16/01/2027 08:00 18:00
Mein Schiff Relax 16/01/2027 09:00 19:00
Marella Discovery 2 17/01/2027 08:00 17:00
Infinity 17/01/2027 11:00 20:00
AIDABlu 18/01/2027 08:00 18:00
AIDAPrima 19/01/2027 08:00 18:00
Fantasia 21/01/2027 08:00 18:00
Azura 21/01/2027 08:00 17:00
AIDAMar 21/01/2027 11:00 20:00
AIDAcosma 22/01/2027 07:30 19:00
Marella Explorer 1 23/01/2027 08:00 18:00
Queen Elizabeth 23/01/2027 09:00 18:00
Mein Schiff Relax 23/01/2027 09:00 19:00
Azura 24/01/2027 09:00 18:00
Marella Discovery 2 24/01/2027 09:00 18:00
Mein Schiff 7 24/01/2027 19:00 23:59
Mein Schiff 7 25/01/2027 00:00 18:00
Wind Spirit 25/01/2027 08:00 13:00
Costa Smeralda 26/01/2027 09:00 19:00
AIDAMar 28/01/2027 08:00 18:00
Fantasia 28/01/2027 08:00 18:00
AIDAcosma 29/01/2027 07:30 19:00
Infinity 30/01/2027 08:00 18:00
Marella Explorer 1 30/01/2027 08:00 18:00
Mein Schiff Relax 30/01/2027 09:00 19:00
Marella Discovery 2 31/01/2027 08:00 17:00
Ventura 02/02/2027 08:00 17:00
Costa Smeralda 02/02/2027 09:00 23:59
Costa Smeralda 03/02/2027 00:00 13:00
Fantasia 04/02/2027 08:00 18:00
Azura 04/02/2027 08:00 17:00
AIDAcosma 05/02/2027 07:30 19:00
Costa Smeralda 06/02/2027 08:00 18:00
Marella Voyager 06/02/2027 08:00 18:00
Mein Schiff Relax 06/02/2027 09:00 19:00
Marella Discovery 2 07/02/2027 09:00 18:00
Mein Schiff 7 07/02/2027 19:00 23:59
Mein Schiff 7 08/02/2027 00:00 18:00
AIDAMar 09/02/2027 08:00 17:00
Infinity 11/02/2027 08:00 18:00
Queen Elizabeth 11/02/2027 08:00 17:00
Fantasia 11/02/2027 08:00 18:00
AIDAcosma 12/02/2027 07:30 19:00
Costa Smeralda 13/02/2027 08:00 18:00
Marella Explorer 1 13/02/2027 08:00 18:00
Mein Schiff Relax 13/02/2027 09:00 19:00
Marella Discovery 2 14/02/2027 08:00 17:00
Explora 2 17/02/2027 09:00 19:00
Fantasia 17/02/2027 12:00 20:00
Azura 18/02/2027 08:00 17:00
Ventura 18/02/2027 08:00 18:00
AIDAcosma 19/02/2027 07:30 19:00
Costa Smeralda 20/02/2027 08:00 18:00
Marella Explorer 1 20/02/2027 08:00 18:00
Mein Schiff Relax 20/02/2027 09:00 19:00
Marella Discovery 2 21/02/2027 08:00 18:00
Mein Schiff 7 21/02/2027 19:00 23:59
Mein Schiff 7 22/02/2027 00:00 18:00
Infinity 22/02/2027 11:00 20:00
Majestic Princess 25/02/2027 07:00 19:00
AIDAMar 25/02/2027 08:00 18:00
Fantasia 25/02/2027 08:00 18:00
AIDAcosma 26/02/2027 07:30 19:00
Costa Smeralda 27/02/2027 08:00 18:00
Mein Schiff Relax 27/02/2027 09:00 19:00
Marella Explorer 1 28/02/2027 08:00 18:00
Sirena 28/02/2027 08:00 17:00
Marella Discovery 2 28/02/2027 08:00 18:00
Fantasia 04/03/2027 08:00 18:00
Azura 04/03/2027 08:00 17:00
AIDAcosma 05/03/2027 07:30 19:00
Iona 06/03/2027 07:00 18:00
Marella Explorer 1 06/03/2027 08:00 18:00
Infinity 06/03/2027 11:00 20:00
Marella Discovery 2 07/03/2027 08:00 18:00
AIDAMar 08/03/2027 08:00 17:00
AIDAMar 09/03/2027 08:00 17:00
Queen Mary 2 09/03/2027 08:00 17:00
Costa Smeralda 11/03/2027 08:00 18:00
Fantasia 11/03/2027 08:00 18:00
AIDAcosma 12/03/2027 07:30 19:00
Costa Smeralda 13/03/2027 08:00 18:00
Marella Explorer 1 13/03/2027 08:00 18:00
Mein Schiff Relax 13/03/2027 09:00 19:00
Marella Discovery 2 14/03/2027 08:00 17:00
Mein Schiff 7 16/03/2027 19:00 23:59
Mein Schiff 7 17/03/2027 00:00 18:00
Fantasia 18/03/2027 08:00 18:00
Azura 18/03/2027 08:00 17:00
AIDAcosma 19/03/2027 07:30 19:00
Iona 20/03/2027 07:00 18:00
Marella Explorer 1 20/03/2027 08:00 18:00
Mein Schiff Relax 20/03/2027 09:00 19:00
Marella Discovery 2 21/03/2027 08:00 17:00
AIDAMar 25/03/2027 08:00 18:00
Costa Smeralda 25/03/2027 08:00 18:00
Fantasia 25/03/2027 08:00 18:00
AIDAcosma 26/03/2027 07:30 19:00
Ventura 26/03/2027 08:00 17:00
Marella Explorer 1 27/03/2027 08:00 18:00
Mein Schiff Relax 27/03/2027 09:00 19:00
Costa Smeralda 30/03/2027 09:00 19:00
Fantasia 01/04/2027 08:00 18:00
AIDAcosma 02/04/2027 07:30 19:00
Marella Explorer 1 03/04/2027 08:00 18:00
Mein Schiff Relax 03/04/2027 09:00 19:00
Mein Schiff 7 04/04/2027 19:00 23:59
Mein Schiff 7 05/04/2027 00:00 18:00
Fantasia 05/04/2027 09:00 20:00
AIDAMar 06/04/2027 08:00 17:00
World Voyager 08/04/2027 08:00 15:30
AIDAcosma 09/04/2027 07:30 19:00
L'Austral 09/04/2027 08:00 18:00
Mein Schiff 7 09/04/2027 08:00 19:00
Marella Explorer 1 10/04/2027 08:00 18:00
Le Boreal 10/04/2027 08:00 18:00
Mein Schiff Relax 10/04/2027 09:00 19:00
Ventura 11/04/2027 08:00 18:00
Seven Seas Voyager 13/04/2027 08:00 17:00
Norwegian Star 15/04/2027 09:30 19:00
AIDAcosma 16/04/2027 07:30 19:00
Marella Explorer 1 17/04/2027 08:00 18:00
World Traveller 17/04/2027 09:00 17:00
Mein Schiff Relax 17/04/2027 09:00 19:00
Insignia 20/04/2027 08:00 18:00
Queen Elizabeth 21/04/2027 08:00 17:00
Seabourn Venture 22/04/2027 07:00 17:00
AIDAcosma 23/04/2027 07:30 19:00
Marella Explorer 1 24/04/2027 08:00 18:00
Mein Schiff Relax 24/04/2027 09:00 19:00
AIDAcosma 25/04/2027 07:00 18:00
Ventura 25/04/2027 08:00 18:00
World Navigator 26/04/2027 12:00 20:00
Marella Explorer 1 28/04/2027 10:00 18:00
World Navigator 29/04/2027 08:00 15:00
Nature 29/04/2027 08:30 19:00`;

const months = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 };

function parseDossierLine(line) {
  const m = line.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})\s+\w+\s+LANZAROTE PORT\s+(.+)\s+([A-Z0-9]+)$/);
  if (!m) throw new Error('Bad dossier: ' + line);
  const year = 2000 + Number(m[3]);
  const month = months[m[2]];
  const day = Number(m[1]);
  const date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return { date, company: m[4].trim(), shipCode: m[5] };
}

function parseShipLine(line) {
  const m = line.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})\s+(\d{2}:\d{2})$/);
  if (!m) throw new Error('Bad ship: ' + line);
  const [d, mo, y] = m[2].split('/').map(Number);
  const date = `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  return { shipName: m[1].trim(), date, arrivalTime: m[3], departureTime: m[4] };
}

const dList = dossier.trim().split('\n').map(parseDossierLine);
const sList = ships.trim().split('\n').map(parseShipLine);

console.log('dossier', dList.length, 'ships', sList.length);
if (dList.length !== sList.length) {
  console.error('COUNT MISMATCH');
  process.exit(1);
}

const mismatches = [];
for (let i = 0; i < dList.length; i++) {
  if (dList[i].date !== sList[i].date) {
    mismatches.push({ i, d: dList[i], s: sList[i] });
  }
}
if (mismatches.length) {
  console.error('DATE MISMATCHES', mismatches.slice(0, 10));
  process.exit(1);
}

function slugify(v) {
  return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

const calls = dList.map((d, i) => {
  const s = sList[i];
  const id = `${d.date}-${slugify(s.shipName)}-${d.shipCode.toLowerCase()}-${String(i).padStart(3,'0')}`;
  return {
    id,
    date: d.date,
    port: 'Puerto de Los Mármoles, Lanzarote',
    company: d.company,
    shipCode: d.shipCode,
    shipName: s.shipName,
    arrivalTime: s.arrivalTime,
    departureTime: s.departureTime,
    season: '2026-2027',
    published: true,
  };
});

import { writeFileSync } from 'fs';
writeFileSync('/workspace/src/data/cruises.json', JSON.stringify({
  season: '2026-2027',
  port: 'Puerto de Los Mármoles, Lanzarote',
  source: 'Temporada Cruceros 2026-2027 — Dossier dia Port',
  updatedAt: new Date().toISOString().slice(0,10),
  calls,
}, null, 2) + '\n');
console.log('Wrote', calls.length, 'calls');
