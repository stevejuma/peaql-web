import { Context, type CreateDatabaseProperties } from "peaql";
import demoSQL from "./lib/demo.sql?raw";

export function defaultDB() {
    const context = Context.create();
    context.execute(demoSQL);
    const data: Record<string, CreateDatabaseProperties> = {};
    for (const [key, value] of context.tables.entries()) {
      data[key] = { data: value.toJSON() };
    }
    return data;
}

export const DEFAULT_QUERY = `select
  playlist.name,
  count(artist.artist_id)
from
  playlist
  join playlist_track pt on pt.playlist_id = playlist.playlist_id
  join track on track.track_id = pt.track_id
  join album on album.album_id = track.album_id
  join artist on artist.artist_id = album.artist_id
group by
  1
order by
  2 desc`;
export const DEFAULT_DB = defaultDB();
