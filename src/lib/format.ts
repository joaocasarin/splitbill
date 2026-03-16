export function formatCurrency(cents: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(cents / 100);
}

const timestampFormatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hourCycle: "h23",
});

export function formatTimestamp(ms: number): string {
    const parts = timestampFormatter.formatToParts(new Date(ms));
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

    return `${map.hour}:${map.minute} ${map.day}/${map.month}/${map.year}`;
}
