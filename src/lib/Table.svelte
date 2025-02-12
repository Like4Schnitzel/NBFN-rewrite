<script lang="ts">
    import type { NameInfo, DictOfFilterTypes, PracticalFilterContent, RarityInfo } from '$lib/types';
    import { onMount } from 'svelte';
    import { target } from '$lib/index';
    import { filtersInputs, countriesInJSON, displayedRarity, loadedNamesCount } from '$lib/stores';
    import Row from './Row.svelte';

    target.addEventListener('loadTable', () => {loadTable()});

    function loadTable()
    {
        practicalFiltersInputs = [];
        sortingInputs = [];
        filtersInputsStringsToValues(); // fill up practicalFiltersInputs and sortingInputs
        const needFilterCheck = practicalFiltersInputs.length > 0;
        rowsToLoad = [];

        for (const row of allRowsInJSON) {
            if (!needFilterCheck || checkFilters(row, practicalFiltersInputs)) {
                rowsToLoad.push(row);
            }
        }

        loadedNamesCount.set(rowsToLoad.length);

        // go backwards because of priority stuff
        for (let i = sortingInputs.length-1; i >= 0; i--) {
            sortRows(sortingInputs[i])
        }

        loadedRows = [];
        for (let i = 0; i < rowsToLoad.length && i < startRows; i++) {
            addRow();
        }
    }

    function addRow() {
        loadedRows.push(rowsToLoad[loadedRows.length]);
        loadedRows = loadedRows;
    }

    function checkFilters(name: NameInfo, filters: PracticalFilterContent[]) {
        let orValues = {} as DictOfFilterTypes;

        for (const filter of filters) {
            switch (filter.Type) {
                case "nameContentFilter": {
                    orValues[filter.Type] ||= filter.InputValues[0].test(name.Name);
                    break;
                }
                case "nameLengthFilter": {
                    if (filter.InputValues[1] !== null)
                    {
                        switch (filter.InputValues[0]) {
                            case "<":
                                orValues[filter.Type] ||= name.Name.length < filter.InputValues[1];
                                break;
                            case ">":
                                orValues[filter.Type] ||= name.Name.length > filter.InputValues[1];
                                break;
                            case "=":
                                orValues[filter.Type] ||= name.Name.length === filter.InputValues[1];
                                break;
                        }
                    }
                    break;
                }
                case "genderFilter": {
                    orValues[filter.Type] ||= name.Gender === filter.InputValues[0];
                    break;
                }
                case "CVBFilter": {
                    if (filter.InputValues[1] !== null)
                    {
                        switch (filter.InputValues[0]) {
                            case "<":
                                orValues[filter.Type] ||= name.CVBs < filter.InputValues[1];
                                break;
                            case ">":
                                orValues[filter.Type] ||= name.CVBs > filter.InputValues[1];
                                break;
                            case "=":
                                orValues[filter.Type] ||= name.CVBs === filter.InputValues[1];
                                break;
                        }
                    }
                    break;
                }
                case "rarityFilter": {
                    const rarityNum = getRarityNum(name.Rarities, filter.InputValues[2]);
                    switch (filter.InputValues[0]) {
                        case "<":
                            orValues[filter.Type] ||= rarityNum < filter.InputValues[1];
                            break;
                        case ">":
                            orValues[filter.Type] ||= rarityNum > filter.InputValues[1];
                            break;
                        case "=":
                            orValues[filter.Type] ||= rarityNum === filter.InputValues[1];
                            break;
                    }
                    break;
                }
                case "nameLengthAndFilter": {
                    if (filter.InputValues[1] !== null)
                    {
                        switch (filter.InputValues[0]) {
                            case "<":
                                if(!(name.Name.length < filter.InputValues[1]))
                                    return false;
                                break;
                            case ">":
                                if (!(name.Name.length > filter.InputValues[1]))
                                    return false;
                                break;
                            case "=":
                                if (!(name.Name.length === filter.InputValues[1]))
                                    return false;
                                break;
                        }
                    }
                    break;
                }
                case "CVBAndFilter": {
                    if (filter.InputValues[1] !== null)
                    {
                        switch (filter.InputValues[0]) {
                            case "<":
                                if (!(name.CVBs < filter.InputValues[1]))
                                    return false;
                                break;
                            case ">":
                                if (!(name.CVBs > filter.InputValues[1]))
                                    return false;
                                break;
                            case "=":
                                if (!(name.CVBs === filter.InputValues[1]))
                                    return false;
                                break;
                        }
                    }
                    break;
                }
                case "rarityAndFilter": {
                    const rarityNum = getRarityNum(name.Rarities, filter.InputValues[2]);
                    switch (filter.InputValues[0]) {
                        case "<":
                            if (!(rarityNum < filter.InputValues[1]))
                                return false;
                            break;
                        case ">":
                            if (!(rarityNum > filter.InputValues[1]))
                                return false;
                            break;
                        case "=":
                            if (!(rarityNum === filter.InputValues[1]))
                                return false;
                            break;
                    }
                    break;
                }
            }
        }

        for (const [key, value] of Object.entries(orValues)) {
            if (!value)
                return false;
        }

        return true;
    }

    function filtersInputsStringsToValues() {
        for (let i = 0; i < $filtersInputs.length; i++) {
            const filter = $filtersInputs[i];

            switch (filter.Type) {
                case "nameContentFilter":
                    const pfc: PracticalFilterContent = {
                        Type: filter.Type,
                        InputValues: []
                    }
                    try {
                        pfc.InputValues = [
                            new RegExp(filter.InputValues[0])
                        ];
                    } catch {
                        pfc.InputValues = [
                            new RegExp("")
                        ];
                    }

                    practicalFiltersInputs.push(pfc);
                    break;
                case "nameLengthFilter":
                case "nameLengthAndFilter":
                case "CVBFilter":
                case "CVBAndFilter":
                    if (filter.InputValues[1] !== null) {
                        practicalFiltersInputs.push({
                            Type: filter.Type,
                            InputValues: filter.InputValues
                        });
                    }
                    break;
                case "genderFilter":
                    practicalFiltersInputs.push({
                        Type: filter.Type,
                        InputValues: filter.InputValues
                    });
                    break;
                case "rarityFilter":
                case "rarityAndFilter":
                    if (filter.InputValues[1] !== null) {
                        practicalFiltersInputs.push({
                            Type: filter.Type,
                            InputValues: [
                                filter.InputValues[0],
                                parseFloat(filter.InputValues[1]),
                                filter.InputValues[2]
                            ]
                        });
                    }
                    break;
                
                case "nameContentSort":
                case "nameLengthSort":
                case "cvbSort":
                    sortingInputs.push({
                        Type: filter.Type,
                        InputValues: [filter.InputValues[0] === "descending"]
                    });
                    break;
                
                case "raritySort":
                    sortingInputs.push({
                        Type: filter.Type,
                        InputValues: [
                            filter.InputValues[0] === "descending",
                            filter.InputValues[1]
                        ]
                    });
                    break;
            }
        }
    }

    function comparisonToNumber(a: any, b: any) {
        if (a > b)
            return 1;
        if (a < b)
            return -1;
        return 0;
    }
    
    function sortRows(filter: PracticalFilterContent) {
        const direction = filter.InputValues[0] ? -1 : 1;
        const typeValPairs = {
            nameContentSort: (x: NameInfo) => x.Name,
            nameLengthSort: (x: NameInfo) => x.Name.length,
            cvbSort: (x: NameInfo) => x.CVBs,
            raritySort: (x: NameInfo) => getRarityNum(x.Rarities, filter.InputValues[1]) || 100*direction
        }

        if (filter.Type in typeValPairs)
        {
            const valExtractionFunction = typeValPairs[filter.Type as keyof typeof typeValPairs];
            rowsToLoad.sort((a, b) => direction * comparisonToNumber(valExtractionFunction(a), valExtractionFunction(b)));
        }
    }

    function maxRarity(rarities: RarityInfo[]) {
        let max = 0;
        for (const rarityInfo of rarities) {
            let rarityNum = rarityInfo.Rarity;

            if (rarityNum > max) {
                max = rarityInfo.Rarity;
            }
        }

        return max;
    }

    function getRarityNum(rarites: RarityInfo[], country: string) {
        if (country === "highest") return maxRarity(rarites);

        for (let rarityInfo of rarites) {
            if (rarityInfo.Country === country) {
                return rarityInfo.Rarity;
            }
        }

        return null;
    }

    const loadRarities = () => {
        loadedRows = loadedRows;
    }

    const loadRows = () => {
        const newLoadedRowsLength = scrollableTable.scrollTop / 20 + startRows;

        for (let i = loadedRows.length; i < rowsToLoad.length && i < newLoadedRowsLength; i++) {
            addRow();
        }
    }

    const updateSearchParams = () => {
        target.dispatchEvent(new CustomEvent("updateSearchParams"));
    }

    onMount(async () => {
        const res = await fetch('nam_dict.json');
        jsonContents = await res.json();
        const countries: string[] = jsonContents.Countries;

        for (const country of countries) {
            countriesInJSON.add(country);
        }

        const names = jsonContents.Names;
        for (const name in names) {
            let row: NameInfo = {
                Name: name,
                Gender: names[name]["Gender"],
                CVBs: names[name]["CVBs"],
                Rarities: []
            };
            for (const rarity in names[name]["Rarities"]) {
                row.Rarities.push({
                    "Country": rarity,
                    "Rarity": names[name]["Rarities"][rarity]
                });
            }

            allRowsInJSON.push(row);
        }

        loadTable();
    });

    let loadedRows: NameInfo[] = [];
    let scrollableTable: HTMLDivElement;
    let rowsToLoad: NameInfo[] = [];
    let allRowsInJSON: NameInfo[] = [];
    const startRows = 50;
    let jsonContents: { Names: any; Countries: string[]; };
    let practicalFiltersInputs: PracticalFilterContent[];
    let sortingInputs: PracticalFilterContent[];
</script>

<table>
    <thead>
        <tr>
        <th class="nameColumn nameHeader"><p>Name</p></th>
        <th class="genderColumn"><p>Gender</p></th>
        <th class="cvbColumn"><p>CVBs</p></th>
        <th class="rarityColumn rarityHeader">
            <p>Rarity in</p>
            <select
                bind:value={$displayedRarity}
                on:change={() => {loadRarities(); updateSearchParams()}}
                class="countrySelector"
            >
                <option value="highest" selected>highest</option>
                {#each $countriesInJSON as country}
                    <option value={country}>{country}</option>
                {/each}
            </select>
        </th>
        </tr>
    </thead>
    <tbody class="jsonDiv" on:scroll={loadRows} bind:this={scrollableTable}>
        {#each loadedRows as row}
            <Row data={row} rarity={getRarityNum(row.Rarities, $displayedRarity)} />
        {/each}
    </tbody>
</table>

<style>
    .nameHeader {
        text-align: left;
        border-radius: var(--table-border-radius) 0px 0px 0px;
    }

    .nameHeader p {
        width: 100%;
    }
  
    .rarityHeader {
        position: relative;
        border-radius: 0px var(--table-border-radius) 0px 0px;
    }
  
    table {
        table-layout: fixed;
        flex-basis: 35%;
        width: max-content;
        margin-right: auto;
        margin-left: auto;
        width: 90%;
        order: 1;
    }

    thead {
        background-color: #cb63d9;
        border-radius: var(--table-border-radius) var(--table-border-radius) 0 0;
        display: block;
    }

    tbody {
        background-color: #cb63d9;
        display: block;
        overflow-y: overlay;
        height: 80vh;
        border-radius: 0 0 var(--table-border-radius) var(--table-border-radius);
    }

    tbody::-webkit-scrollbar {
        display: none;
    }
  
    .countrySelector {
        width: 52%;
    }
  
    th {
        border-right: solid 1px black;
        border-left: solid 1px black;
        border-top: solid 1px black;
        height: min-content;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    th p {
        margin: 0;
        display: inline-block;
    }
  
    tr {
        display: grid;
        grid-template-columns: 35% 15% 15% auto;
        margin: 0 auto;
        font-family: Arial, Helvetica, sans-serif;
    }

    @media (min-width: 1210px) {
        table {
            table-layout: fixed;
            flex-basis: 35%;
            width: max-content;
            order: 0;
            margin: 0;
        }
    }
  </style>
