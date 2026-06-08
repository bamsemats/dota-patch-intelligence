async function inspect(version: string) {
    const url = `https://www.dota2.com/datafeed/patchnotes?version=${version}&language=english`;

    console.log("Fetching:", url);

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    console.dir(data, {
        depth: null,
        colors: true
    });
}

inspect("7.41d").catch(console.error);