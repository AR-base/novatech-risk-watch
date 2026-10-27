# Builds story.html: injects the shared case data and the French text (dashboard dictionary + story strings).
import json
B = '/home/claude/story/'
data = json.load(open(B + 'data.json'))
site_fr = json.load(open('/home/claude/site/i18n/fr_dict.json', encoding='utf-8'))
phr = dict(json.load(open('/home/claude/site/i18n/fr_phrases.json', encoding='utf-8')))
EN = {  # keyed strings: key -> English text
 'now-lead':"NOVATECH grew 35% in two years with 25 new hires, three agencies and more cloud. These are today's numbers from the team dashboard.",
 'contain-lead':"What happens on the team's phones when a cyberattack is spotted, from the first alert to the incident closed.",
 'cost-lead':'Drag the slider: the later an incident is contained, the more of its worst case is already lost.',
 'team-lead':'Seven analysts, one slice of the radar each. Select a poster to open the risk.',
 'step4b':'For a cyberattack the demo laptop isolates itself; when every step is done the loss avoided is secured.',
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
FR.update({
 'Hand control':'Contrôle à la main', 'Turn off':'Arrêter', 'How to':'Mode d’emploi',
 'Point with your index finger. Pinch thumb and index to click. Close your fist to go back. Point at the top or bottom edge to scroll.':'Pointez avec l’index. Pincez pouce et index pour cliquer. Fermez le poing pour revenir. Pointez le bord haut ou bas pour défiler.',
 'Starting the camera…':'Démarrage de la caméra…', 'Allow the camera when the browser asks. The video stays on this device.':'Autorisez la caméra quand le navigateur le demande. La vidéo reste sur cet appareil.',
 'Loading hand tracking…':'Chargement du suivi de la main…', 'The first time takes a few seconds.':'La première fois prend quelques secondes.',
 'Hand control is on':'Contrôle à la main activé', 'Show your hand to the camera. Pinch to click, fist to go back.':'Montrez votre main à la caméra. Pincez pour cliquer, poing pour revenir.',
 'Camera permission was refused. Allow the camera for this site in the address bar, then try again.':'L’accès à la caméra a été refusé. Autorisez la caméra pour ce site dans la barre d’adresse, puis réessayez.',
 'No camera was found on this device.':'Aucune caméra trouvée sur cet appareil.', 'The camera is used by another app. Close it and try again.':'La caméra est utilisée par une autre application. Fermez-la et réessayez.',
 'This browser cannot use the camera here.':'Ce navigateur ne peut pas utiliser la caméra ici.', 'Hand tracking could not load. It needs an internet connection the first time.':'Le suivi de la main n’a pas pu se charger. Il faut une connexion internet la première fois.',
 'Hand control is off':'Contrôle à la main désactivé',
})
FR.update({
 'Search the risks':'Rechercher un risque', 'Search':'Rechercher', 'Home':'Accueil', 'Right now':'En ce moment', 'Dossier figures':'Chiffres du dossier', 'Live team data':'Données de l’équipe en direct',
 'The sixteen NOVATECH risks':'Les seize risques de NOVATECH', "Ranked by today's score, most dangerous first. Select a poster to open it.":'Classés par score du jour, le plus dangereux en premier. Sélectionnez une affiche pour l’ouvrir.',
 'No risk matches that search.':'Aucun risque ne correspond à cette recherche.', 'Matching risks are lit up.':'Les risques correspondants sont allumés.',
 'Score now':'Score actuel', 'Contained':'Contenu', 'Watch the response':'Voir la réponse', 'Gallery':'Galerie', 'Open in the dashboard':'Ouvrir dans le tableau de bord', 'Back':'Retour',
 'What happens':'Ce qui arrive', 'The damage':'Les dégâts', 'Early warnings':'Signaux d’alerte', 'no reading yet':'pas encore de mesure',
 'Play the response':'Lancer la réponse', 'From the first alert to the incident closed':'De la première alerte à l’incident clôturé',
 'past its threshold':'seuil dépassé', 'An early warning went off.':'Un signal d’alerte s’est déclenché.',
 '{a} asked the CEO to contain {r}':'{a} demande au PDG de contenir {r}', 'Damage so far':'Dommages', 'each hour of waiting':'chaque heure d’attente',
 'Approved by {c} (CEO)':'Validé par {c} (PDG)', 'Containment started.':'Confinement lancé.', '{p}: your task for {r}':'{p} : votre tâche pour {r}', 'Done: step 1':'Fait : étape 1',
 'Incident closed: {r}':'Incident clôturé : {r}', 'Loss avoided':'Perte évitée', 'No change logged yet':'Aucun changement enregistré', 'Also plays the CEO':'Joue aussi le PDG',
 'The incident is closed':'L’incident est clôturé',
 'now-lead':'NOVATECH a grandi de 35 % en deux ans avec 25 recrues, trois agences et plus de cloud. Voici les chiffres du jour issus du tableau de bord de l’équipe.',
 'contain-lead':'Ce qui se passe sur les téléphones de l’équipe quand une cyberattaque est repérée, de la première alerte à l’incident clôturé.',
 'cost-lead':'Faites glisser le curseur : plus un incident est contenu tard, plus une part de son pire scénario est déjà perdue.',
 'team-lead':'Sept analystes, chacun sa part du radar. Sélectionnez une affiche pour ouvrir le risque.',
 'step4b':'Pour une cyberattaque, l’ordinateur de démonstration s’isole ; quand toutes les étapes sont faites, la perte évitée est acquise.',
})
fr = {}
fr.update(phr); fr.update(site_fr); fr.update(FR); fr['__en'] = EN
src = open(B + 'story.src.html', encoding='utf-8').read()
src = src.replace('__HANDCTL__', open(B + 'handctl.js', encoding='utf-8').read())
src = src.replace('__POSTERS__', open(B + 'posters.js', encoding='utf-8').read())
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
