async function main() {
    const res = await fetch('https://api.stratz.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.STRATZ_API_KEY,
            'User-Agent': 'STRATZ_API'
        },
        body: JSON.stringify({
            query: `query { 
                heroStats { 
                    winGameVersion(bracketIds: [DIVINE], take: 5000) { 
                        gameVersionId 
                    } 
                } 
            }`
        })
    });
    const data = await res.json();
    const versions = [...new Set(data.data.heroStats.winGameVersion.map(v => v.gameVersionId))];
    console.log("Available GameVersion IDs:", versions.sort((a,b)=>b-a));
}
main();