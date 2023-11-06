import { writable } from 'svelte/store';
import type { FilterContent } from "./types";

function createFiltersList() {
    const { subscribe, set, update } = writable<FilterContent[]>([]);

    return {
        subscribe,
        delete: (i: number) => update((fc) => {
            fc.splice(i, 1);
            return fc;
        }),
        add: (filter: FilterContent) => update((fc) => {
            fc.push(filter);
            return fc;
        }),
        set: (val: FilterContent[]) => update((fc) => {
            fc = val;
            return fc;
        })
    }
}

function createCountriesList() {
    const { subscribe, set, update } = writable<string[]>([]);

    return {
        subscribe,
        add: (country: string) => update((cl) => {
            cl.push(country);
            return cl;
        })
    }
}

function createDisplayedRarity() {
    const { subscribe, set, update } = writable<string>("highest");

    return {
        subscribe,
        set: (rarity: string) => update(() => {
            return rarity;
        })
    }
}

export const filtersInputs = createFiltersList();
export const countriesInJSON = createCountriesList();
export const displayedRarity = createDisplayedRarity();
