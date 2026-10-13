# Prototyp 0.1 — implementacja

## Obecny zakres

Pełna lokalna pętla baza → sektor → wydobycie → dokowanie/strata → rozliczenie → ulepszenia. Grafika świata, statków i stacji powstaje z figur Pixi. Krótkie efekty WAV zostały wygenerowane lokalnie przez `scripts/generate-sounds.mjs` i są ładowane przez preload boilera.

Zachowano Core, esbuild, preload i manifest zasobów, magistralę zdarzeń, UI/WorldTime, ustawienia, system efektów, SoundManager, popupy i komponenty Button/Box/Typography/Slider. System świata oraz progresji znajduje się w `frontend/game`.

Rapier 2D 0.21.0 jest inicjalizowany przed wejściem do bazy. Fizyka działa w kroku 1/60 s. Kadłub obraca się przez impuls momentu obrotowego, silniki nadają ciąg, hamowanie ma ograniczoną siłę. Obraz jest interpolowany między krokami. Działko bada odcinek przebytej drogi pocisku przez ray cast. Ciała fizyczne i kolejka kolizji są zwalniane po zakończeniu sektora.

## Zapis i straty

`asteroids.campaign.v1` w localStorage zawiera dane kampanii i znacznik aktywnej wyprawy. Start zapisuje ten znacznik, zanim gracz wejdzie do sektora. Wczytanie takiego zapisu oznacza utratę aktywnego pilota, kadłuba i zamontowanych modułów. Baza, bank i pozostali piloci pozostają.

Po dokowaniu łup i ewentualna premia są rozliczane raz. Przy pełnym magazynie komponenty mają pierwszeństwo, a nadwyżka jest raportowana. Zestaw awaryjny przyznaje tylko brakujące elementy, na które gracza nie stać. Zapis jest walidowany, a niedostępny localStorage nie przerywa działania bieżącej sesji.

Ratunek pilota i odzyskanie wraku są kolejnym planowanym systemem, a nie obecną losową mechaniką.

## Weryfikacja

- `npm run typecheck`: kod aplikacji sprawdzany w trybie strict. `skipLibCheck` pomija konflikt zewnętrznych deklaracji FontFaceSet między DOM TypeScript i zależnością Pixi.
- `npm run lint`: ESLint i Prettier.
- `npm test`: 12 testów obejmujących generowanie wielu sektorów, transakcje, limity magazynu, trwałe straty, znacznik przerwanej wyprawy, zakup modułów, błędne zapisy oraz rzeczywistą symulację Rapier (dryf, hamowanie, wydobycie, dokowanie, obrażenia od zderzeń i jednorazowe przeszukanie wraku).
- `npm run build`: produkcyjny frontend i serwer.
- Sprawdzenie w przeglądarce: baza, start, lot, hamowanie, rozbijanie asteroid, zbieranie rudy i komponentu, nawigacja do bazy, dokowanie, rozliczenie ładunku, odświeżenie jako strata i zestaw awaryjny.

## Kolejne prace

Balans prędkości, mas i kosztów wymaga dalszego grania. Do osobnej weryfikacji pozostają dłuższe sesje, skrajne prędkości względem ruchomych celów i wydajność na słabszym sprzęcie. Sterowanie jest na razie przeznaczone dla myszy i klawiatury. Walka, załoga, awarie, infiltracja, ratunek i wznawianie wyprawy są poza obecnym zakresem.
