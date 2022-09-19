import type { MapGameEndResult ,  MapRoundResult, z } from "GCSocketClient";
type playersRoundResult = z.infer<typeof MapRoundResult>[0]
type playersGameResult = z.infer<typeof MapGameEndResult>[0]
export function getPlayerNameFromPlayer(player: playersRoundResult | playersGameResult) {
    try {
    return player?.userName?.toLowerCase() === player?.displayName?.toLocaleLowerCase()
        ? player.userName
        : player.displayName;
    }
    catch (e) {
        return "player not found"
    }
}