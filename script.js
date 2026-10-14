
"use strict";

const messageInput = document.getElementById("message");
const boutonEnvoyer = document.getElementById("envoyer");
const conversation = document.getElementById("conversation");

const WORKER_URL = "https://tyrone.tyt-friot.workers.dev/";
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 2000;

let historique = chargerDepuisStockage("tyroneHistorique", []);
let envoiEnCours = false;

function chargerDepuisStockage(cle, valeurParDefaut) {
    try {
        const contenu = localStorage.getItem(cle);
        return contenu ? JSON.parse(contenu) : valeurParDefaut;
    } catch {
        return valeurParDefaut;
    }
}

function sauvegarder() {
    try {
        localStorage.setItem("tyroneHistorique", JSON.stringify(historique));
    } catch (error) {
        console.warn("Sauvegarde impossible :", error);
    }
}

function ajouterMessage(texte, auteur) {
    const message = document.createElement("div");
    message.className = `message ${auteur}`;
    message.textContent = texte;
    conversation.appendChild(message);
    conversation.scrollTop = conversation.scrollHeight;
    return message;
}

function chargerHistorique() {
    if (conversation.dataset.historiqueCharge === "oui") return;
    conversation.dataset.historiqueCharge = "oui";

    historique.forEach(message => {
        if (message && typeof message.texte === "string") {
            if (message.auteur === "utilisateur" || message.auteur === "tyrone") {
                ajouterMessage(message.texte, message.auteur);
            }
        }
    });
}

function definirEnvoiEnCours(enCours) {
    envoiEnCours = enCours;
    boutonEnvoyer.disabled = enCours;
    messageInput.disabled = enCours;
    boutonEnvoyer.textContent = enCours ? "…" : "➤";
}

function ajouterAuContexte(auteur, texte) {
    historique.push({ auteur, texte });
    if (historique.length > 100) historique = historique.slice(-100);
    sauvegarder();
}

async function envoyerMessage() {
    if (envoiEnCours) return;

    const texte = messageInput.value.trim();
    if (!texte) return;

    if (texte.length > MAX_MESSAGE_LENGTH) {
        ajouterMessage("Ton message est trop long : 2000 caractères maximum.", "tyrone");
        return;
    }

    ajouterMessage(texte, "utilisateur");
    ajouterAuContexte("utilisateur", texte);
    messageInput.value = "";
    definirEnvoiEnCours(true);

    const messageAttente = ajouterMessage("Je réfléchis…", "tyrone");

    try {
        const contexte = historique
            .slice(0, -1)
            .slice(-MAX_HISTORY_MESSAGES)
            .map(element => ({
                role: element.auteur === "utilisateur" ? "user" : "assistant",
                content: element.texte
            }));

        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: texte, history: contexte })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("Réponse du serveur illisible.");
        }

        if (!response.ok) {
            throw new Error(data?.error || `Erreur serveur (${response.status}).`);
        }

        if (typeof data.reply !== "string" || !data.reply.trim()) {
            throw new Error("Le serveur n'a pas renvoyé de réponse.");
        }

        messageAttente.remove();
        ajouterMessage(data.reply.trim(), "tyrone");
        ajouterAuContexte("tyrone", data.reply.trim());

    } catch (error) {
        console.error("Erreur Tyrone :", error);
        messageAttente.textContent =
            "Je n'arrive pas à contacter mon IA. Détail : " + error.message;
    } finally {
        definirEnvoiEnCours(false);
        messageInput.focus();
    }
}

boutonEnvoyer.addEventListener("click", envoyerMessage);

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        envoyerMessage();
    }
});

chargerHistorique();
