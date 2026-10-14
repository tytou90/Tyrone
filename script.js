
"use strict";

// =============================================
// TYRONE — ASSISTANT PERSONNEL
// Connexion à Cloudflare Workers AI
// =============================================

const messageInput = document.getElementById("message");
const boutonEnvoyer = document.getElementById("envoyer");
const conversation = document.getElementById("conversation");

const WORKER_URL =
    "https://tyrone.tyt-friot.workers.dev/";

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2000;

let historique = chargerDepuisStockage(
    "tyroneHistorique",
    []
);

let envoiEnCours = false;


// =============================================
// MÉMOIRE LOCALE
// =============================================

function chargerDepuisStockage(cle, valeurParDefaut) {
    try {
        const contenu = localStorage.getItem(cle);

        return contenu
            ? JSON.parse(contenu)
            : valeurParDefaut;

    } catch (error) {
        console.warn(
            `Impossible de lire ${cle} :`,
            error
        );

        return valeurParDefaut;
    }
}


function sauvegarder() {
    try {
        localStorage.setItem(
            "tyroneHistorique",
            JSON.stringify(historique)
        );

    } catch (error) {
        console.warn(
            "Impossible de sauvegarder l'historique :",
            error
        );
    }
}


// =============================================
// AFFICHAGE DES MESSAGES
// =============================================

function ajouterMessage(texte, auteur) {
    const message = document.createElement("div");

    message.className = `message ${auteur}`;
    message.textContent = texte;

    conversation.appendChild(message);

    conversation.scrollTop =
        conversation.scrollHeight;

    return message;
}


function chargerHistorique() {
    // Empêche de charger deux fois le même historique.
    if (
        conversation.dataset.historiqueCharge === "oui"
    ) {
        return;
    }

    conversation.dataset.historiqueCharge = "oui";

    historique.forEach(message => {
        if (
            message &&
            typeof message.texte === "string" &&
            (
                message.auteur === "utilisateur" ||
                message.auteur === "tyrone"
            )
        ) {
            ajouterMessage(
                message.texte,
                message.auteur
            );
        }
    });
}


// =============================================
// ÉTAT DE L'INTERFACE
// =============================================

function definirEnvoiEnCours(enCours) {
    envoiEnCours = enCours;

    boutonEnvoyer.disabled = enCours;
    messageInput.disabled = enCours;

    boutonEnvoyer.textContent =
        enCours ? "…" : "➤";
}


// =============================================
// SAUVEGARDE DE L'HISTORIQUE
// =============================================

function ajouterAuContexte(auteur, texte) {
    historique.push({
        auteur,
        texte
    });

    // Limite la taille de l'historique enregistré.
    if (historique.length > 100) {
        historique = historique.slice(-100);
    }

    sauvegarder();
}


// =============================================
// ENVOI À L'INTELLIGENCE ARTIFICIELLE
// =============================================

async function envoyerMessage() {
    if (envoiEnCours) {
        return;
    }

    const texte = messageInput.value.trim();

    if (!texte) {
        return;
    }

    if (texte.length > MAX_MESSAGE_LENGTH) {
        ajouterMessage(
            "Ton message est trop long. " +
            `La limite est de ${MAX_MESSAGE_LENGTH} caractères.`,
            "tyrone"
        );

        return;
    }

    // Affiche et sauvegarde le message utilisateur.
    ajouterMessage(texte, "utilisateur");

    ajouterAuContexte(
        "utilisateur",
        texte
    );

    messageInput.value = "";

    definirEnvoiEnCours(true);

    const messageAttente = ajouterMessage(
        "Je réfléchis…",
        "tyrone"
    );

    try {
        // Prépare les échanges précédents.
        // Le message actuel est envoyé séparément.
        const contexte = historique
            .slice(0, -1)
            .slice(-MAX_HISTORY_MESSAGES)
            .map(element => ({
                role:
                    element.auteur === "utilisateur"
                        ? "user"
                        : "assistant",

                content: element.texte
            }));

        const response = await fetch(WORKER_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: texte,
                history: contexte
            })
        });

        let data;

        try {
            data = await response.json();

        } catch {
            throw new Error(
                "Le serveur a renvoyé une réponse illisible."
            );
        }

        if (!response.ok) {
            throw new Error(
                data && data.error
                    ? data.error
                    : `Erreur serveur (${response.status}).`
            );
        }

        if (
            !data ||
            typeof data.reply !== "string" ||
            !data.reply.trim()
        ) {
            throw new Error(
                "Le serveur n'a pas renvoyé de réponse."
            );
        }

        // Remplace le message d'attente par la réponse.
        messageAttente.remove();

        const reponse = data.reply.trim();

        ajouterMessage(
            reponse,
            "tyrone"
        );

        ajouterAuContexte(
            "tyrone",
            reponse
        );

    } catch (error) {
        console.error(
            "Erreur de connexion à Tyrone AI :",
            error
        );

        messageAttente.textContent =
            "Je n'arrive pas à contacter mon IA. " +
            "Vérifie le déploiement Cloudflare puis réessaie. " +
            "Détail : " + error.message;

    } finally {
        definirEnvoiEnCours(false);
        messageInput.focus();
    }
}


// =============================================
// ÉVÉNEMENTS
// =============================================

boutonEnvoyer.addEventListener(
    "click",
    envoyerMessage
);


messageInput.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            envoyerMessage();
        }
    }
);


// =============================================
// DÉMARRAGE
// =============================================

chargerHistorique();
