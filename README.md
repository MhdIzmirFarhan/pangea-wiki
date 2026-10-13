# Pangea Wiki

An interactive landing page for the Pangea universe lore, with two portals.

## Running

```sh
# PowerShell
$env:ADMIN_PASSWORD = "choose-a-password"; npm start
```

- Viewer: http://localhost:3000/
- Admin:  http://localhost:3000/admin

If `ADMIN_PASSWORD` is not set, a one-time password is printed in the console. Set `PORT` to change the port. No `npm install` needed — the server has no dependencies (Node 18+).

## Hosting (GitHub Pages)

Every push to `main` publishes the viewer to GitHub Pages via `.github/workflows/pages.yml` (enable it once under **Settings → Pages → Source: GitHub Actions**). Pages only serves static files, so the admin portal is not deployed: edit content locally with `npm start`, then commit and push `data/content.json` to update the live site.

## Portals

### Viewer Portal (`/`)
Read-only pages for visitors. The home page shows the hero, the Core Chronicle and the Nations; characters and organizations are reached from the nav dropdowns, and maps from the Maps link.

### Admin Portal (`/admin`)
Password-protected form editor. The admin can change **information only** — text, image URLs, icons, accent colours (from the fixed palette), and add/remove/reorder list entries (nations, characters, races, history, religions, maps, organizations, story acts, universe menu entries). The layout, styling and markup cannot be changed: the server validates every save against `public/js/schema.js`, drops unknown fields, and the viewer escapes all text so no HTML can be injected.

Every save keeps a copy of the previous version in `data/backups/`.

## Structure

```
server.js              Static server + content API (login, save)
data/content.json      All site content (what the admin edits)
public/
  index.html           Viewer page shell
  nation.html          Nation dossier page (?id=<nation-code>)
  character.html       Character dossier page (?id=<name-slug>)
  organization.html    Organization dossier page (?id=<name-slug>)
  maps.html            Map atlas with clickable pins
  chronicle.html       Core Chronicle timeline + act pages (?id=<title-slug>)
  races.html           Races overview + entry pages (?id=<name-slug>)
  history.html         History timeline + event pages
  religions.html       Religions overview + entry pages
  regions.html         Continents & regions overview + entry pages
  admin/index.html     Admin page shell
  css/site.css         Shared base styles
  js/theme.js          Shared Tailwind theme
  js/schema.js         Editable-field definitions + validation (shared by browser and server)
  js/common.js         Shared header/footer, safe HTML helpers
  js/viewer.js         Renders the home page
  js/nation.js         Renders a nation page
  js/character.js      Renders a character page
  js/organization.js   Renders an organization page
  js/maps.js           Renders the map atlas
  js/lore.js           Renders the chronicle, races, history, religions and regions pages
  js/admin.js          Schema-driven editor
```

To add a new editable field, add it to `schema.js` and `content.json`, then use it in `viewer.js`.
