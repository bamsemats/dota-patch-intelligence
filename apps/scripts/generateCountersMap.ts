// apps/scripts/generateCountersMap.ts

import { readFile, writeFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";

require('dotenv').config();

const RESEARCH_DIR = path.resolve("research-output");
const MAPPINGS_DIR = path.join(RESEARCH_DIR, "mappings");
const OUTPUT_FILE = path.join(MAPPINGS_DIR, "hero_counters.json");
const HEROES_FILE = path.join(MAPPINGS_DIR, "heroes.json");

const hasApiKey = !!process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (hasApiKey) {
    ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });
}

const FALLBACK_COUNTERS: Record<string, { counters: string[], partners: string[] }> = {
    "Anti-Mage": {
        counters: ["Doom", "Outworld Destroyer", "Silencer", "Legion Commander", "Meepo", "Axe", "Bloodseeker"],
        partners: ["Grimstroke", "Magnus", "Io", "Shadow Shaman", "Rubick", "Dazzle"]
    },
    "Axe": {
        counters: ["Outworld Destroyer", "Lifestealer", "Timbersaw", "Viper", "Venomancer", "Ancient Apparition"],
        partners: ["Dazzle", "Omniknight", "Invoker", "Oracle", "Grimstroke"]
    },
    "Bane": {
        counters: ["Abaddon", "Omniknight", "Slark", "Tidehunter", "Silencer"],
        partners: ["Mirana", "Pudge", "Razor", "Kunkka", "Lina"]
    },
    "Bloodseeker": {
        counters: ["Storm Spirit", "Troll Warlord", "Abaddon", "Wraith King", "Medusa", "Dragon Knight"],
        partners: ["Zeus", "Spectre", "Nature's Prophet", "Crystal Maiden", "Ancient Apparition"]
    },
    "Crystal Maiden": {
        counters: ["Earth Spirit", "Clockwerk", "Silencer", "Night Stalker", "Doom", "Pudge"],
        partners: ["Juggernaut", "Sven", "Ursa", "Lina", "Slark", "Morphling"]
    },
    "Drow Ranger": {
        counters: ["Phantom Assassin", "Clockwerk", "Axe", "Storm Spirit", "Spirit Breaker", "Mars"],
        partners: ["Vengeful Spirit", "Ancient Apparition", "Viper", "Enigma", "Tidehunter"]
    },
    "Earthshaker": {
        counters: ["Silencer", "Doom", "Lifestealer", "Rubick", "Skywrath Mage"],
        partners: ["Morphling", "Enigma", "Magnus", "Storm Spirit", "Crystal Maiden"]
    },
    "Juggernaut": {
        counters: ["Outworld Destroyer", "Bane", "Slark", "Windranger", "Wraith King", "Pugna"],
        partners: ["Crystal Maiden", "Shadow Shaman", "Lich", "Magnus", "Grimstroke"]
    },
    "Mirana": {
        counters: ["Abaddon", "Slark", "Puck", "Storm Spirit", "Clockwerk"],
        partners: ["Bane", "Shadow Shaman", "Lion", "Underlord", "Earthshaker"]
    },
    "Morphling": {
        counters: ["Anti-Mage", "Ancient Apparition", "Silencer", "Puck", "Phantom Lancer", "Outworld Destroyer"],
        partners: ["Earthshaker", "Crystal Maiden", "Lich", "Rubick", "Dazzle"]
    },
    "Shadow Fiend": {
        counters: ["Templar Assassin", "Puck", "Storm Spirit", "Zeus", "Doom", "Nyx Assassin"],
        partners: ["Vengeful Spirit", "Dark Seer", "Magnus", "Underlord", "Enigma"]
    },
    "Phantom Lancer": {
        counters: ["Earthshaker", "Sven", "Leshrac", "Timbersaw", "Sand King", "Axe"],
        partners: ["Keeper of the Light", "Dazzle", "Omniknight", "Crystal Maiden", "KotL"]
    },
    "Puck": {
        counters: ["Silencer", "Night Stalker", "Anti-Mage", "Doom", "Nyx Assassin"],
        partners: ["Lina", "Lancer", "Lich", "Phoenix", "Faceless Void"]
    },
    "Pudge": {
        counters: ["Lifestealer", "Slark", "Timbersaw", "Outworld Destroyer", "Ursa"],
        partners: ["Bane", "Crystal Maiden", "Techies", "Omniknight", "Chen"]
    },
    "Razor": {
        counters: ["Viper", "Outworld Destroyer", "Sniper", "Weaver", "Windranger"],
        partners: ["Bane", "Shadow Shaman", "Crystal Maiden", "Io", "Omniknight"]
    },
    "Sand King": {
        counters: ["Doom", "Lifestealer", "Silencer", "Rubick", "Zeus"],
        partners: ["Lina", "Leshrac", "Grimstroke", "Dark Seer", "Magnus"]
    },
    "Storm Spirit": {
        counters: ["Anti-Mage", "Silencer", "Doom", "Night Stalker", "Riki"],
        partners: ["Lifestealer", "Io", "Keeper of the Light", "Chen", "Crystal Maiden"]
    },
    "Sven": {
        counters: ["Viper", "Venomancer", "Outworld Destroyer", "Windranger", "Razor"],
        partners: ["Magnus", "Io", "Crystal Maiden", "Dazzle", "Lich"]
    },
    "Tiny": {
        counters: ["Lifestealer", "Necrophos", "Timbersaw", "Viper", "Venomancer"],
        partners: ["Io", "Lycan", "Keeper of the Light", "Pudge", "Centaur Warrunner"]
    },
    "Vengeful Spirit": {
        counters: ["Slark", "Puck", "Doom", "Rubick", "Silencer"],
        partners: ["Drow Ranger", "Luna", "Terrorblade", "Phantom Assassin", "Medusa"]
    },
    "Windranger": {
        counters: ["Axe", "Centaur Warrunner", "Spectre", "Bloodseeker", "Blade Mail"],
        partners: ["Bane", "Shadow Shaman", "Grimstroke", "Io", "Lich"]
    },
    "Zeus": {
        counters: ["Anti-Mage", "Puck", "Storm Spirit", "Huskar", "Viper", "Layan"],
        partners: ["Bloodseeker", "Spectre", "Nature's Prophet", "Crystal Maiden", "Keeper of the Light"]
    },
    "Kunkka": {
        counters: ["Lifestealer", "Timbersaw", "Outworld Destroyer", "Ursa", "Razor"],
        partners: ["Bane", "Lina", "Shadow Shaman", "Dark Seer", "Tidehunter"]
    },
    "Lina": {
        counters: ["Puck", "Storm Spirit", "Anti-Mage", "Nyx Assassin", "Silencer"],
        partners: ["Bane", "Shadow Shaman", "Sand King", "Kunkka", "Crystal Maiden"]
    },
    "Lion": {
        counters: ["Abaddon", "Slark", "Tidehunter", "Silencer", "Lifestealer"],
        partners: ["Mirana", "Lina", "Sven", "Ursa", "Morphling"]
    },
    "Shadow Shaman": {
        counters: ["Silencer", "Abaddon", "Slark", "Doom", "Oracle"],
        partners: ["Ursa", "Juggernaut", "Lina", "Mirana", "Sven"]
    },
    "Slardar": {
        counters: ["Viper", "Venomancer", "Outworld Destroyer", "Windranger", "Razor"],
        partners: ["Lifestealer", "Io", "Sven", "Magnus", "Shadow Shaman"]
    },
    "Tidehunter": {
        counters: ["Slark", "Outworld Destroyer", "Lifestealer", "Timbersaw", "Rubick"],
        partners: ["Enigma", "Magnus", "Kunkka", "Warlock", "Crystal Maiden"]
    },
    "Witch Doctor": {
        counters: ["Silencer", "Doom", "Night Stalker", "Clockwerk", "Pudge"],
        partners: ["Faceless Void", "Magnus", "Enigma", "Juggernaut", "Sven"]
    },
    "Lich": {
        counters: ["Silencer", "Doom", "Clockwerk", "Pudge", "Oracle"],
        partners: ["Juggernaut", "Sven", "Faceless Void", "Void Spirit", "Spectre"]
    },
    "Riki": {
        counters: ["Slardar", "Bounty Hunter", "Zeus", "Axe", "Bristleback"],
        partners: ["Grimstroke", "Io", "Dark Seer", "Magnus", "Crystal Maiden"]
    },
    "Enigma": {
        counters: ["Silencer", "Rubick", "Doom", "Clockwerk", "Pudge", "Vengeful Spirit"],
        partners: ["Tidehunter", "Warlock", "Magnus", "Faceless Void", "Witch Doctor"]
    },
    "Tinker": {
        counters: ["Anti-Mage", "Puck", "Storm Spirit", "Spectre", "Nyx Assassin", "Doom"],
        partners: ["Beastmaster", "Lycan", "Nature's Prophet", "Crystal Maiden", "Keeper of the Light"]
    },
    "Sniper": {
        counters: ["Storm Spirit", "Clockwerk", "Spirit Breaker", "Phantom Assassin", "Pudge", "Axe"],
        partners: ["Dazzle", "Omniknight", "Ogre Magi", "Tidehunter", "Underlord"]
    },
    "Necrophos": {
        counters: ["Anti-Mage", "Doom", "Ancient Apparition", "Silencer", "Pugna"],
        partners: ["Omniknight", "Abaddon", "Io", "Oracle", "Huskar"]
    },
    "Warlock": {
        counters: ["Silencer", "Doom", "Oracle", "Rubick", "Pugna"],
        partners: ["Enigma", "Tidehunter", "Magnus", "Witch Doctor", "Lich"]
    },
    "Beastmaster": {
        counters: ["Timbersaw", "Lifestealer", "Winter Wyvern", "Leshrac", "Sand King"],
        partners: ["Tinker", "Lycan", "Keeper of the Light", "Crystal Maiden", "Sven"]
    },
    "Queen of Pain": {
        counters: ["Puck", "Anti-Mage", "Silencer", "Doom", "Nyx Assassin"],
        partners: ["Bane", "Shadow Shaman", "Grimstroke", "Io", "Crystal Maiden"]
    },
    "Venomancer": {
        counters: ["Abaddon", "Slark", "Oracle", "Huskar", "Lifestealer"],
        partners: ["Viper", "Sand King", "Underlord", "Clockwerk", "Tidehunter"]
    },
    "Faceless Void": {
        counters: ["Doom", "Outworld Destroyer", "Bane", "Pugna", "Omniknight"],
        partners: ["Witch Doctor", "Skywrath Mage", "Invoker", "Lich", "Phoenix"]
    },
    "Wraith King": {
        counters: ["Anti-Mage", "Invoker", "Slark", "Outworld Destroyer", "Lifestealer"],
        partners: ["Crystal Maiden", "Lich", "Dazzle", "Grimstroke", "Io"]
    },
    "Death Prophet": {
        counters: ["Anti-Mage", "Doom", "Silencer", "Ancient Apparition", "Puck"],
        partners: ["Omniknight", "Abaddon", "Dazzle", "Underlord", "Tidehunter"]
    },
    "Phantom Assassin": {
        counters: ["Axe", "Centaur Warrunner", "Timbersaw", "Troll Warlord", "Razor", "Windranger"],
        partners: ["Magnus", "Omniknight", "Dazzle", "Io", "Vengeful Spirit"]
    },
    "Pugna": {
        counters: ["Anti-Mage", "Silencer", "Doom", "Puck", "Nyx Assassin"],
        partners: ["Lina", "Leshrac", "Skywrath Mage", "Zeus", "Enigma"]
    },
    "Templar Assassin": {
        counters: ["Venomancer", "Batrider", "Jakiro", "Viper", "Huskar"],
        partners: ["Dazzle", "Vengeful Spirit", "Sven", "Magnus", "Io"]
    },
    "Viper": {
        counters: ["Anti-Mage", "Puck", "Phantom Assassin", "Slark", "Windranger"],
        partners: ["Venomancer", "Drow Ranger", "Underlord", "Clockwerk", "Tidehunter"]
    },
    "Luna": {
        counters: ["Sven", "Slark", "Anti-Mage", "Clockwerk", "Phantom Assassin"],
        partners: ["Vengeful Spirit", "Shadow Shaman", "Crystal Maiden", "Io", "Magnus"]
    },
    "Dragon Knight": {
        counters: ["Lifestealer", "Timbersaw", "Slark", "Outworld Destroyer", "Razor"],
        partners: ["Io", "Omniknight", "Crystal Maiden", "Dazzle", "Lich"]
    },
    "Dazzle": {
        counters: ["Axe", "Ancient Apparition", "Silencer", "Doom", "Oracle"],
        partners: ["Huskar", "Slark", "Axe", "Wraith King", "Sven"]
    },
    "Clockwerk": {
        counters: ["Lifestealer", "Ursa", "Timbersaw", "Force Staff", "Lycan"],
        partners: ["Sniper", "Invoker", "Zeus", "Skywrath Mage", "Nature's Prophet"]
    },
    "Leshrac": {
        counters: ["Anti-Mage", "Pugna", "Silencer", "Doom", "Nyx Assassin"],
        partners: ["Shadow Shaman", "Bane", "Sand King", "Pugna", "Grimstroke"]
    },
    "Nature's Prophet": {
        counters: ["Storm Spirit", "Spirit Breaker", "Clockwerk", "Spectre", "Tinker"],
        partners: ["Zeus", "Bloodseeker", "Spectre", "Crystal Maiden", "Io"]
    },
    "Lifestealer": {
        counters: ["Bane", "Razor", "Windranger", "Slark", "Troll Warlord", "Ursa"],
        partners: ["Storm Spirit", "Slardar", "Io", "Spirit Breaker", "Crystal Maiden"]
    },
    "Dark Seer": {
        counters: ["Anti-Mage", "Doom", "Silencer", "Oracle", "Slark"],
        partners: ["Sven", "Phantom PLancer", "Riki", "Magnus", "Tidehunter"]
    },
    "Clinkz": {
        counters: ["Slardar", "Bounty Hunter", "Zeus", "Axe", "Bristleback"],
        partners: ["Crystal Maiden", "Dazzle", "Lich", "Magnus", "Grimstroke"]
    },
    "Omniknight": {
        counters: ["Oracle", "Shadow Demon", "Doom", "Silencer", "Slark"],
        partners: ["Huskar", "Sven", "Phantom Assassin", "Slardar", "Outworld Destroyer"]
    },
    "Enchantress": {
        counters: ["Broodmother", "Phantom Assassin", "Sven", "Leshrac", "Naga Siren"],
        partners: ["Io", "Chen", "Crystal Maiden", "Ursa", "Lifestealer"]
    },
    "Huskar": {
        counters: ["Ancient Apparition", "Necrophos", "Doom", "Windranger", "Chaos Knight"],
        partners: ["Dazzle", "Oracle", "Omniknight", "Io", "Necrophos"]
    },
    "Night Stalker": {
        counters: ["Tidehunter", "Underlord", "Doom", "Bristleback", "Axe"],
        partners: ["Keeper of the Light", "Io", "Crystal Maiden", "Bane", "Shadow Shaman"]
    },
    "Broodmother": {
        counters: ["Earthshaker", "Sven", "Legion Commander", "Sand King", "Timbersaw"],
        partners: ["Dazzle", "Omniknight", "Keeper of the Light", "Crystal Maiden", "Io"]
    },
    "Bounty Hunter": {
        counters: ["Slardar", "Zeus", "Axe", "Bristleback", "Doom"],
        partners: ["Spectre", "Zeus", "Nature's Prophet", "Crystal Maiden", "Storm Spirit"]
    },
    "Weaver": {
        counters: ["Silencer", "Doom", "Bloodseeker", "Axe", "Faceless Void"],
        partners: ["Io", "Omniknight", "Crystal Maiden", "Dazzle", "Abaddon"]
    },
    "Jakiro": {
        counters: ["Silencer", "Doom", "Puck", "Rubick", "Lifestealer"],
        partners: ["Faceless Void", "Enigma", "Tidehunter", "Magnus", "Void Spirit"]
    },
    "Batrider": {
        counters: ["Abaddon", "Slark", "Oracle", "Vengeful Spirit", "Doom"],
        partners: ["Lina", "Leshrac", "Grimstroke", "Dark Seer", "Magnus"]
    },
    "Chen": {
        counters: ["Sven", "Leshrac", "Earthshaker", "Doom", "Timbersaw"],
        partners: ["Juggernaut", "Sven", "Alchemist", "Lycan", "Beastmaster"]
    },
    "Spectre": {
        counters: ["Lifestealer", "Slark", "Anti-Mage", "Necrophos", "Doom"],
        partners: ["Zeus", "Bloodseeker", "Nature's Prophet", "Crystal Maiden", "Warlock"]
    },
    "Ancient Apparition": {
        counters: ["Puck", "Storm Spirit", "Anti-Mage", "Doom", "Silencer"],
        partners: ["Axe", "Void", "Chrono", "Slark", "Bloodseeker", "Sven"]
    },
    "Doom": {
        counters: ["Wraith King", "Medusa", "Lifestealer", "Abaddon", "Slark"],
        partners: ["Grimstroke", "Io", "Shadow Shaman", "Bane", "Crystal Maiden"]
    },
    "Ursa": {
        counters: ["Bane", "Razor", "Windranger", "Viper", "Venomancer", "Slark"],
        partners: ["Shadow Shaman", "Crystal Maiden", "Io", "Omniknight", "Dazzle"]
    },
    "Spirit Breaker": {
        counters: ["Underlord", "Doom", "Tidehunter", "Slardar", "Lifestealer"],
        partners: ["Lifestealer", "Nature's Prophet", "Zeus", "Spectre", "Crystal Maiden"]
    },
    "Gyrocopter": {
        counters: ["Anti-Mage", "Puck", "Storm Spirit", "Juggernaut", "Lifestealer"],
        partners: ["Io", "Crystal Maiden", "Dazzle", "Magnus", "Lich"]
    },
    "Alchemist": {
        counters: ["Slark", "Lifestealer", "AA", "Necrophos", "Bane"],
        partners: ["Io", "Dazzle", "Oracle", "Omniknight", "Chen"]
    },
    "Invoker": {
        counters: ["Anti-Mage", "Puck", "Storm Spirit", "Doom", "Silencer"],
        partners: ["Faceless Void", "Tidehunter", "Enigma", "Magnus", "Crystal Maiden"]
    },
    "Silencer": {
        counters: ["Abaddon", "Slark", "Tidehunter", "Doom", "Lifestealer"],
        partners: ["Anti-Mage", "Phantom Assassin", "Sven", "Ursa", "Spectre"]
    },
    "Outworld Destroyer": {
        counters: ["Anti-Mage", "Puck", "Nyx Assassin", "Silencer", "Doom"],
        partners: ["Omniknight", "Abaddon", "Dazzle", "Oracle", "Io"]
    },
    "Lycan": {
        counters: ["Sven", "Earthshaker", "Timbersaw", "Leshrac", "Sand King"],
        partners: ["Tinker", "Beastmaster", "Keeper of the Light", "Crystal Maiden", "Io"]
    },
    "Brewmaster": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Death Prophet"],
        partners: ["Lina", "Leshrac", "Grimstroke", "Dark Seer", "Magnus"]
    },
    "Shadow Demon": {
        counters: ["Silencer", "Doom", "Puck", "Rubick", "Lifestealer"],
        partners: ["Luna", "Terrorblade", "Kunkka", "Leshrac", "Mirana"]
    },
    "Lone Druid": {
        counters: ["Lifestealer", "Slark", "Doom", "Timbersaw", "Ursa"],
        partners: ["Dazzle", "Omniknight", "Keeper of the Light", "Crystal Maiden", "Io"]
    },
    "Chaos Knight": {
        counters: ["Sven", "Earthshaker", "Timbersaw", "Sand King", "Leshrac"],
        partners: ["Io", "Crystal Maiden", "Dazzle", "Lich", "Grimstroke"]
    },
    "Meepo": {
        counters: ["Earthshaker", "Sven", "Timbersaw", "Leshrac", "Sand King", "Wyvern"],
        partners: ["Dazzle", "Omniknight", "Keeper of the Light", "Crystal Maiden", "Io"]
    },
    "Treant Protector": {
        counters: ["Timbersaw", "Phoenix", "Doom", "Lifestealer", "Silencer"],
        partners: ["Crystal Maiden", "Spectre", "Medusa", "Sniper", "Sven"]
    },
    "Ogre Magi": {
        counters: ["Silencer", "Doom", "Slark", "Lifestealer", "Rubick"],
        partners: ["Sniper", "Sven", "Phantom Assassin", "Ursa", "Juggernaut"]
    },
    "Undying": {
        counters: ["Sven", "Earthshaker", "Timbersaw", "Leshrac", "Gyrocopter"],
        partners: ["Crystal Maiden", "Dazzle", "Lich", "Warlock", "Tidehunter"]
    },
    "Rubick": {
        counters: ["Slark", "Silencer", "Doom", "Riki", "Bounty Hunter"],
        partners: ["Earthshaker", "Enigma", "Tidehunter", "Magnus", "Faceless Void"]
    },
    "Disruptor": {
        counters: ["Abaddon", "Slark", "Doom", "Oracle", "Lifestealer"],
        partners: ["Faceless Void", "Enigma", "Tidehunter", "Magnus", "Void Spirit"]
    },
    "Nyx Assassin": {
        counters: ["Slardar", "Bounty Hunter", "Zeus", "Axe", "Bristleback"],
        partners: ["Lina", "Leshrac", "Grimstroke", "Storm Spirit", "Puck"]
    },
    "Naga Siren": {
        counters: ["Sven", "Earthshaker", "Timbersaw", "Sand King", "Leshrac"],
        partners: ["Dazzle", "Omniknight", "Keeper of the Light", "Crystal Maiden", "KotL"]
    },
    "Keeper of the Light": {
        counters: ["Storm Spirit", "Puck", "Clockwerk", "Doom", "Silencer"],
        partners: ["Phantom Lancer", "Sven", "Tiny", "Morphling", "Storm Spirit"]
    },
    "Io": {
        counters: ["AA", "Doom", "Silencer", "Necrophos", "Lifestealer"],
        partners: ["Tiny", "Sven", "Gyrocopter", "Alchemist", "Chaos Knight", "Anti-Mage"]
    },
    "Visage": {
        counters: ["Sven", "Earthshaker", "Timbersaw", "Leshrac", "Crimson Guard"],
        partners: ["Dazzle", "Omniknight", "Keeper of the Light", "Crystal Maiden", "Io"]
    },
    "Slark": {
        counters: ["Axe", "Bloodseeker", "Doom", "Timbersaw", "Leshrac", "Sven"],
        partners: ["Omniknight", "Dazzle", "Abaddon", "Oracle", "Io"]
    },
    "Medusa": {
        counters: ["Anti-Mage", "Invoker", "Slark", "Outworld Destroyer", "Diffusal Blade"],
        partners: ["Dazzle", "Omniknight", "Treant Protector", "Io", "Vengeful Spirit"]
    },
    "Troll Warlord": {
        counters: ["Razor", "Windranger", "Slark", "Bane", "Viper", "Venomancer"],
        partners: ["Crystal Maiden", "Io", "Dazzle", "Omniknight", "Lich"]
    },
    "Centaur Warrunner": {
        counters: ["Lifestealer", "Timbersaw", "Outworld Destroyer", "Viper", "Venomancer"],
        partners: ["Shadow Shaman", "Bane", "Rubick", "Lina", "Tiny"]
    },
    "Magnus": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Rubick"],
        partners: ["Sven", "Phantom Assassin", "Juggernaut", "Anti-Mage", "Ember Spirit"]
    },
    "Timbersaw": {
        counters: ["Doom", "Silencer", "Anti-Mage", "Pugna", "Ancient Apparition"],
        partners: ["Omniknight", "Abaddon", "Dazzle", "Oracle", "Io"]
    },
    "Bristleback": {
        counters: ["Doom", "Silencer", "Ancient Apparition", "Necrophos", "Viper", "Silver Edge"],
        partners: ["Omniknight", "Abaddon", "Dazzle", "Oracle", "Io"]
    },
    "Tusk": {
        counters: ["Doom", "Lifestealer", "Silencer", "Slark", "Rubick"],
        partners: ["Centaur Warrunner", "Tiny", "Techies", "Shadow Shaman", "Lina"]
    },
    "Skywrath Mage": {
        counters: ["Pugna", "Anti-Mage", "Silencer", "Nyx Assassin", "Puck", "Doom"],
        partners: ["Faceless Void", "Legion Commander", "Clockwerk", "Bane", "Shadow Shaman"]
    },
    "Abaddon": {
        counters: ["Doom", "Silencer", "AA", "Necrophos", "Slark"],
        partners: ["Huskar", "Slark", "Weaver", "Spectre", "Wraith King"]
    },
    "Elder Titan": {
        counters: ["Storm Spirit", "Puck", "Clockwerk", "Doom", "Silencer"],
        partners: ["Faceless Void", "Enigma", "Tidehunter", "Magnus", "Crystal Maiden"]
    },
    "Legion Commander": {
        counters: ["Outworld Destroyer", "Bane", "Pugna", "Omniknight", "Linken's Sphere"],
        partners: ["Skywrath Mage", "Io", "Dazzle", "Oracle", "Grimstroke"]
    },
    "Techies": {
        counters: ["Zeus", "Night Stalker", "Clockwerk", "Pudge", "Silencer"],
        partners: ["Pudge", "Tusk", "Bane", "Shadow Shaman", "Crystal Maiden"]
    },
    "Ember Spirit": {
        counters: ["Silencer", "Doom", "Night Stalker", "Riki", "Puck"],
        partners: ["Magnus", "Grimstroke", "Io", "Lich", "Crystal Maiden"]
    },
    "Earth Spirit": {
        counters: ["Silencer", "Doom", "Lifestealer", "Rubick", "Oracle"],
        partners: ["Lina", "Leshrac", "Grimstroke", "Storm Spirit", "Puck"]
    },
    "Underlord": {
        counters: ["Lifestealer", "Timbersaw", "Slark", "Outworld Destroyer", "Razor"],
        partners: ["Sniper", "Viper", "Venomancer", "Spectre", "Tidehunter"]
    },
    "Terrorblade": {
        counters: ["Leshrac", "Timbersaw", "Necrophos", "Zeus", "Lion"],
        partners: ["Vengeful Spirit", "Dazzle", "Omniknight", "Shadow Demon", "Io"]
    },
    "Phoenix": {
        counters: ["Silencer", "Doom", "Ursa", "Juggernaut", "Troll Warlord"],
        partners: ["Faceless Void", "Enigma", "Tidehunter", "Magnus", "Void Spirit"]
    },
    "Oracle": {
        counters: ["Doom", "Silencer", "AA", "Necrophos", "Slark"],
        partners: ["Huskar", "Slark", "Sven", "Phantom Assassin", "Legion Commander"]
    },
    "Winter Wyvern": {
        counters: ["Silencer", "Doom", "Lifestealer", "Rubick", "Slark"],
        partners: ["Faceless Void", "Enigma", "Tidehunter", "Magnus", "Void Spirit"]
    },
    "Arc Warden": {
        counters: ["Storm Spirit", "Phantom Assassin", "Clockwerk", "Spectre", "Meepo"],
        partners: ["Dazzle", "Omniknight", "Keeper of the Light", "Crystal Maiden", "Io"]
    },
    "Monkey King": {
        counters: ["Timbersaw", "Viper", "Venomancer", "Slardar", "Bloodseeker"],
        partners: ["Magnus", "Grimstroke", "Io", "Crystal Maiden", "Bane"]
    },
    "Dark Willow": {
        counters: ["Silencer", "Doom", "Slark", "Lifestealer", "Puck"],
        partners: ["Faceless Void", "Grimstroke", "Mars", "Void Spirit", "Spectre"]
    },
    "Pangolier": {
        counters: ["Doom", "Silencer", "Bloodseeker", "Axe", "Lifestealer"],
        partners: ["Magnus", "Grimstroke", "Io", "Lich", "Crystal Maiden"]
    },
    "Grimstroke": {
        counters: ["Silencer", "Doom", "Slark", "Lifestealer", "Rubick"],
        partners: ["Doom", "Bane", "Lich", "Necrophos", "Lina", "Pangolier", "Earth Spirit"]
    },
    "Hoodwink": {
        counters: ["Storm Spirit", "Puck", "Clockwerk", "Doom", "Silencer"],
        partners: ["Bane", "Shadow Shaman", "Grimstroke", "Io", "Lich"]
    },
    "Void Spirit": {
        counters: ["Silencer", "Doom", "Night Stalker", "Riki", "Puck"],
        partners: ["Grimstroke", "Io", "Lich", "Crystal Maiden", "Magnus"]
    },
    "Snapfire": {
        counters: ["Storm Spirit", "Puck", "Clockwerk", "Doom", "Silencer"],
        partners: ["Faceless Void", "Enigma", "Tidehunter", "Magnus", "Crystal Maiden"]
    },
    "Mars": {
        counters: ["Lifestealer", "Necrophos", "Timbersaw", "Viper", "Venomancer"],
        partners: ["Phoenix", "Dark Willow", "Invoker", "Skywrath Mage", "Witch Doctor"]
    },
    "Ringmaster": {
        counters: ["Silencer", "Doom", "Slark", "Lifestealer", "Puck"],
        partners: ["Faceless Void", "Magnus", "Enigma", "Tidehunter", "Crystal Maiden"]
    },
    "Dawnbreaker": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Rubick"],
        partners: ["Spectre", "Storm Spirit", "Io", "Crystal Maiden", "Sven"]
    },
    "Marci": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Rubick"],
        partners: ["Io", "Crystal Maiden", "Dazzle", "Magnus", "Lich"]
    },
    "Primal Beast": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Rubick"],
        partners: ["Lina", "Leshrac", "Grimstroke", "Dark Seer", "Magnus"]
    },
    "Muerta": {
        counters: ["Anti-Mage", "Puck", "Storm Spirit", "Huskar", "Doom"],
        partners: ["Bane", "Shadow Shaman", "Grimstroke", "Io", "Lich"]
    },
    "Kez": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Axe"],
        partners: ["Grimstroke", "Io", "Magnus", "Crystal Maiden", "Dazzle"]
    },
    "Largo": {
        counters: ["Doom", "Silencer", "Lifestealer", "Slark", "Timbersaw"],
        partners: ["Grimstroke", "Io", "Magnus", "Crystal Maiden", "Dazzle"]
    }
};

async function main() {
    console.log("=========================================");
    console.log("   Dota 2 Hero Counters & Synergies Map   ");
    console.log("=========================================\n");

    await mkdir(MAPPINGS_DIR, { recursive: true });

    let existingData: Record<string, { counters: string[], partners: string[] }> = {};
    try {
        const raw = await readFile(OUTPUT_FILE, "utf8");
        existingData = JSON.parse(raw);
        console.log(`[Counters] Loaded existing counters map with ${Object.keys(existingData).length} heroes.`);
    } catch {
        console.log("[Counters] No existing counters map found. Creating a new one.");
    }

    const heroesRaw = await readFile(HEROES_FILE, "utf8");
    const heroesMap: Record<string, string> = JSON.parse(heroesRaw);
    const heroNames = Object.values(heroesMap);

    console.log(`[Counters] Target roster contains ${heroNames.length} heroes.`);

    // Process in batches of 10 in parallel
    const BATCH_SIZE = 10;
    for (let i = 0; i < heroNames.length; i += BATCH_SIZE) {
        const batch = heroNames.slice(i, i + BATCH_SIZE);
        console.log(`[Counters] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(heroNames.length / BATCH_SIZE)}...`);
        
        await Promise.all(batch.map(async (hero) => {
            if (existingData[hero]) {
                // Already has valid data
                return;
            }

            console.log(`[Counters] Mapping counters & partners for "${hero}"...`);
            let heroResult = FALLBACK_COUNTERS[hero];

            if (!heroResult) {
                // If completely missing from fallback list, create generic mappings based on standard Dota logic
                heroResult = {
                    counters: ["Doom", "Silencer", "Slark", "Lifestealer", "Axe"],
                    partners: ["Grimstroke", "Io", "Magnus", "Crystal Maiden", "Dazzle"]
                };
            }

            if (hasApiKey && ai) {
                try {
                    const systemPrompt = `You are a professional Dota 2 coach and analyst.
Provide 5-7 distinct official hero names that counter the target hero (either in lane, mechanically, or overall strategy) and 5-7 official hero names that synergize strongly as partners/allies.
Return the result strictly as JSON matching this schema:
{
  "counters": ["HeroA", "HeroB", "HeroC", "HeroD", "HeroE"],
  "partners": ["HeroF", "HeroG", "HeroH", "HeroI", "HeroJ"]
}
Only use official, exact English hero names from the Dota 2 roster. Do not use slang, abbreviations, or items.`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: `Target Hero: "${hero}"`,
                        config: {
                            systemInstruction: systemPrompt,
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    counters: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    partners: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["counters", "partners"]
                            },
                            temperature: 0.1
                        }
                    });

                    if (response.text) {
                        const parsed = JSON.parse(response.text);
                        if (Array.isArray(parsed.counters) && Array.isArray(parsed.partners)) {
                            heroResult = {
                                counters: parsed.counters.filter(Boolean),
                                partners: parsed.partners.filter(Boolean)
                            };
                            console.log(`[Counters] Successfully generated via Gemini for ${hero}.`);
                        }
                    }
                } catch (e: any) {
                    console.error(`[Counters] LLM mapping failed for ${hero}: ${e.message}. Using fallback.`);
                }
            } else {
                console.log(`[Counters] Using fallback mapping for ${hero}.`);
            }

            existingData[hero] = heroResult;
        }));

        await writeFile(OUTPUT_FILE, JSON.stringify(existingData, null, 2), "utf8");
    }

    console.log(`\n✔️ SUCCESS: Saved counters and partners mapping to ${OUTPUT_FILE}`);
}

main().catch(console.error);
