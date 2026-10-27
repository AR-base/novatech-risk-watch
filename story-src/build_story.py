# Builds story.html: injects the shared case data and the French text (dashboard dictionary + story strings).
import json
B = '/home/claude/story/'
data = json.load(open(B + 'data.json'))
site_fr = json.load(open('/home/claude/site/i18n/fr_dict.json', encoding='utf-8'))
phr = dict(json.load(open('/home/claude/site/i18n/fr_phrases.json', encoding='utf-8')))
EN = {  # keyed strings: key -> English text
 'hero-p1':'Revenue up 35% in two years, 25 new hires, three agencies and a lot more cloud. Growth brought sixteen risks with it.',
 'hero-p2':'Seven analysts watch them on one live radar. Every dot is a risk; the closer to the centre, the more dangerous.',
 'lineup-note':'Each capsule is a risk, standing with the analyst who found it. Taller means a higher score (likelihood × impact, 1 to 16). Switch to “After plan” to watch the mitigation plan shrink them, and select one to open it.',
 'step1':'The dashboard alerts the people responsible on their phones before the risk turns into an incident.',
 'step2':'Containing can stop services and lock laptops, so the request goes to the CEO’s phone with what is at stake.',
 'step3':'Each step of the playbook goes to the person who owns it. Their Done button ticks it on every screen.',
 'step4':'For a cyberattack, the demo laptop isolates itself, just like an endpoint-security tool would.',
 'foot1':'ESAIP Risk Management, NOVATECH “Risk Detective” case. Anish, Mereena, Sudheer, Fatah, Rambabu, Krishna, Niranjan.',
}
FR = {
 'risk watch':'risk watch', 'Open the dashboard':'Ouvrir le tableau de bord', 'DOSSIER DATA':'DONNÉES DU DOSSIER', 'LIVE DATA':'DONNÉES EN DIRECT',
 'Live release, autumn 2026':'Sortie en direct, automne 2026', 'NOVATECH Services':'NOVATECH Services',
 'hero-p1':'Chiffre d’affaires +35 % en deux ans, 25 recrues, trois agences et beaucoup plus de cloud. La croissance a amené seize risques.',
 'hero-p2':'Sept analystes les surveillent sur un seul radar en direct. Chaque point est un risque ; plus il est près du centre, plus il est dangereux.',
 'Meet the sixteen':'Découvrir les seize', 'The radar right now':'Le radar en ce moment', 'risks are critical right now':'risques critiques en ce moment',
 "expected loss a year at today's progress":'de perte attendue par an, au niveau d’avancement actuel', 'early-warning alerts open':'alertes précoces ouvertes',
 'Figures from the NOVATECH dossier':'Chiffres du dossier NOVATECH', 'Live from the team database, updated':'En direct depuis la base de l’équipe, mis à jour à',
 'of staff can telework':'des salariés peuvent télétravailler', 'revenue in two years':'de CA en deux ans', 'hires in two years':'recrues en deux ans',
 'Watched all year round':'Surveillés toute l’année', 'The sixteen':'Les seize', 'Before actions':'Avant actions', 'Now':'Maintenant', 'After plan':'Après le plan',
 'lineup-note':'Chaque capsule est un risque, rangée avec l’analyste qui l’a trouvé. Plus elle est haute, plus le score est élevé (probabilité × impact, de 1 à 16). Passez à « Après le plan » pour voir le plan d’action les réduire, et sélectionnez-en une pour l’ouvrir.',
 'Contain it':'Contenir', 'See a cyberattack contained, from alert to approval':'Une cyberattaque contenue, de l’alerte à la validation',
 'An indicator crosses its threshold':'Un indicateur franchit son seuil', 'step1':'Le tableau de bord alerte les responsables sur leur téléphone avant que le risque ne devienne un incident.',
 'The CEO approves':'Le PDG valide', 'step2':'Contenir peut arrêter des services et bloquer des ordinateurs : la demande part sur le téléphone du PDG avec ce qui est en jeu.',
 'Everyone gets their task':'Chacun reçoit sa tâche', 'step3':'Chaque étape du plan va à la personne qui en est responsable. Son bouton Fait la coche sur tous les écrans.',
 'The infected laptop goes dark':'L’ordinateur infecté s’éteint', 'step4':'Pour une cyberattaque, l’ordinateur de démonstration s’isole, comme le ferait un outil de sécurité des postes.',
 'Every hour':'Chaque heure', 'counts':'compte', 'Pick an incident':'Choisissez un incident', 'Contained after':'Contenu après', 'at the alert':'à l’alerte', '1 day':'1 jour', '2 days':'2 jours', '3 days':'3 jours',
 'Damage already done':'Dommages déjà subis', 'Loss avoided by containing':'Perte évitée grâce au confinement', 'Worst case if nothing is done':'Pire scénario sans action',
 'of the worst case already lost':'du pire scénario déjà perdus', 'Each hour of delay costs about':'Chaque heure de retard coûte environ', 'Without action this risk reaches its full cost in about':'Sans action, ce risque atteint son coût total en environ', 'days':'jours', 'at once':'tout de suite',
 'Made in Angers by':'Fait à Angers par', 'Seven analysts':'Sept analystes', 'also plays the CEO':'joue aussi le PDG', 'Your turn':'À vous', 'Watch it live':'En direct',
 'foot1':'ESAIP, gestion des risques, cas NOVATECH « Risk Detective ». Anish, Mereena, Sudheer, Fatah, Rambabu, Krishna, Niranjan.', 'Source on GitHub':'Code source sur GitHub',
 'Risk Watch':'Risk Watch', 'Every hour counts':'Chaque heure compte', 'The team':'L’équipe', 'Risk radar':'Radar des risques',
 'score':'score', 'Critical':'Critique', 'High':'Élevé', 'Moderate':'Modéré', 'Low':'Faible', 'Close':'Fermer', 'Analyst':'Analyste', 'Owner':'Responsable',
 'Cause':'Cause', 'Event':'Événement', 'Impact':'Impact', 'If it happens':'Si cela arrive', 'What lowers it':'Ce qui le réduit', 'Someone':'Quelqu’un', 'went down':'a baissé', 'went up':'a monté',
 'Play again':'Rejouer', 'Approve':'Valider', 'Reject':'Refuser', 'Done: step 3':'Fait : étape 3',
 'R2 Cyberattack':'R2 Cyberattaque', 'Staff who can telework: 40%, past amber.':'Salariés pouvant télétravailler : 40 %, seuil orange dépassé.',
 'Anish asked the CEO to contain R2':'Anish demande au PDG de contenir R2', 'Damage so far ≈ €96k, each hour of waiting ≈ €15k.':'Dommages ≈ 96 k€, chaque heure d’attente ≈ 15 k€.',
 'Approved by Krishna (CEO)':'Validé par Krishna (PDG)', 'Containment started after 2 min.':'Confinement lancé après 2 min.',
 'Niranjan: your task for R2':'Niranjan : votre tâche pour R2', '3. Isolate infected laptops from the network':'3. Isoler du réseau les ordinateurs infectés',
 'LAPTOP-07 isolated':'LAPTOP-07 isolé', 'Network access cut. Shutting down.':'Accès réseau coupé. Arrêt en cours.', 'Incident closed: R2':'Incident clôturé : R2', 'Loss avoided ≈ €1.1M.':'Perte évitée ≈ 1,1 M€.',
 'IT & cyber':'IT & cyber', 'Legal & data':'Juridique & données', 'Suppliers':'Fournisseurs', 'People':'RH', 'Governance':'Gouvernance', 'Finance':'Finance', 'Tools & sites':'Outils & sites',
}
fr = {}
fr.update(phr); fr.update(site_fr); fr.update(FR); fr['__en'] = EN
src = open(B + 'story.src.html', encoding='utf-8').read()
out = src.replace('__DATA__', json.dumps(data, ensure_ascii=False)).replace('__FR__', json.dumps(fr, ensure_ascii=False))
open(B + 'story.html', 'w', encoding='utf-8').write(out)
# report data strings that have no French yet
miss = set()
for r in data['RISKS']:
    for k in ('name', 'cat', 'cause', 'event', 'cons'):
        if r[k] not in fr: miss.add(r[k])
for a in data['ACTIONS']:
    if a['title'] not in fr: miss.add(a['title'])
for steps in data['PLAYBOOKS'].values():
    for st, role in steps:
        for x in (st, role):
            if x not in fr: miss.add(x)
print('built', len(out), '| missing FR:', len(miss)); [print('  ', m) for m in sorted(miss)]
