export function isDiscordSnowflake(allegedSnowflake: string)
{
    return /\d{18}/.test(allegedSnowflake);
}

export function assertDiscordSnowflake(allegedSnowflake: string)
{
    if (!isDiscordSnowflake(allegedSnowflake))
        throw new Error(`"${allegedSnowflake}" is not a Discord snowflake`);
}

export function isInteger(allegedInteger)
{
    return ['number', 'bigint'].includes(typeof allegedInteger) && allegedInteger % 1 < 1e-12
}

export function assertInteger(allegedInteger)
{
    if (!isInteger(allegedInteger))
        throw new Error(`type assertion failed: ${allegedInteger} is not an integer`);
}
