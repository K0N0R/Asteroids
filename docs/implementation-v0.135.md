# 0.135 — stabilność WebGL, interakcje i Fobos

Stan: 2026-10-24. Aplikacja 0.135.0. Format kampanii 67 i dziennika 32 pozostaje zgodny z 0.134; nie wprowadzono resetu zapisu.

## Zasoby anomalii

Poprzednia ścieżka tworzyła ImageBitmap w workerze i nowe tekstury przy przemieszczaniu kamery. Zgłoszone błędy mailbox/shared image wskazują właśnie na transport zasobów graficznych pomiędzy procesami. Nie przypisujemy konkretnego resetu sterownika jednej potwierdzonej przyczynie: nie odtworzono sprzętowego zawieszenia całego komputera.

- Worker przesyła zwykłe bufory RGBA. Pixi używa BufferImageSource, a nie ImageBitmap/ImageSource. Rasteryzacja prosi o kontekst 2D z willReadFrequently; po odczycie pikseli oba tymczasowe canvasy mają zerowany rozmiar.
- Pula zawiera maksymalnie 48 ponownie używanych tekstur 320×320, bez mipmap. To 18,75 MiB szczegółowych tekstur zamiast poprzednich 100 MiB (64×640×640). Zachowane dane CPU zajmują drugie tyle; dodatkowo istnieje ograniczone tło całej anomalii i najwyżej jeden gotowy kafelek.
- Przelot nad nowym obszarem aktualizuje wolny slot. Nie tworzy kolejnych zasobów GPU, jeśli pula ma już wystarczającą pojemność. Działa jeden worker i jedno zadanie naraz; odpowiedzi starej generacji oraz odpowiedzi po zniszczeniu widoku są odrzucane.
- Jeden widok anomalii pozostaje przy przejściach między mapami Marsa. Na powierzchni i przy dużej asteroidzie jest ukryty, a po powrocie wykorzystuje te same zasoby. Pełne zamknięcie świata zwalnia worker, piksele, tekstury i bufory siatki.
- Rozdzielczość szczegółowej warstwy jest niższa, ale zachowano ciągłe tło, rozmycie brzegów i deformację. Budżet obrazu nie rośnie wraz z rozmiarem świata.

## Utrata i odtworzenie kontekstu

Utrata WebGL zatrzymuje ticker, symulację, silniki i pozostałe dźwięki rozgrywki oraz czyści wciśnięte klawisze. Pojawia się informacja o przywracaniu grafiki. Powtórne zdarzenie utraty nie nadpisuje informacji o wcześniejszym stanie tickera.

Po odtworzeniu kontekstu odświeżane są teksty, wektory, cache i tekstury anomalii z zachowanych pikseli, w tym zasoby widoku chwilowo ukrytego. W pełnej GameSession gra otwiera pauzę zamiast od razu wznawiać lot. Odzyskiwanie nie zależy od żywotności wcześniejszego mailboxa ani zamkniętej bitmapy.

Zarejestrowana utrata kontekstu zapisuje opcjonalny znacznik przerwania technicznego aktywnej wyprawy. Przy ponownym otwarciu gry taka wyprawa wraca do lobby z tym samym statkiem i pilotem, bez rozliczenia przegranej, nowych nagród czy XP. Nie dotyczy już zakończonej śmierci statku ani sandboxa. Pozostają zapisywane na bieżąco dostawy i postęp fabuły; nie odtwarzamy niezapisanej zawartości ładowni. Ochrona wymaga dostarczenia zdarzenia utraty kontekstu i udanego zapisu lokalnego; nagłe zamknięcie procesu lub awaria systemu przed zdarzeniem nie jest wykrywalna tą drogą.

## Pozostałe poprawki

- Usunięto stare łuki postępu dla dokowania, wraków, skanów, skrytek, odzysku i przejścia księżycowego. Został jeden obrys F/H, przytrzymanie 1 s. Promień wynika z fizycznej ilustracji celu, bez podpisów; dla Satuk 15 nie obejmuje wielkiego obszaru tarczy. Autonomiczne pomiary Keplera i wskaźniki alarmu zachowują odrębne znaczenie.
- Po zabezpieczeniu Marsa bieżący cel wskazuje eskortę Keplera. Stary zapisany komunikat „Wyeliminuj pozostałe wymagane jednostki” jest usuwany z kolejki i oznaczany jako obsłużony.
- Przed alarmem baza Fobosa ma jeden patrol z prędkością 42. Raz podchodzi do bazy, po czym zapętla długi obwód pozostałego obszaru księżyca. Zauważenie gracza w zasięgu i bez przeszkody uruchamia alarm; skaner bazy również pozostaje aktywny. Dopiero alarm pozwala fabryce produkować posiłki.
- Terminal Fobosa był pomijany przez wspólną listę celów interakcji. Teraz pełne przytrzymanie F uruchamia włamanie i pokazuje ten sam pojedynczy wskaźnik.
- Drony zasadzki powstają przy pierwszym wejściu na orbitę Fobosa, blisko punktu przylotu, i natychmiast przechodzą do pościgu. Nie ma komunikatu ani kontaktów zdradzających zasadzkę przed wejściem. Po ich pokonaniu jednorazowa łączność komentuje zasadzkę i zleca zbadanie Fobosa. Cel nie zdradza instalacji przed jej odkryciem.

## Weryfikacja

- 276/276 testów zestawu akceptacyjnego, w tym 34 testy Marsa, zapis, sterowanie, gospodarka, odkrywanie, HUD, audio, geometria labiryntu i zasoby renderera. Raport: `dist/acceptance-stability-final.txt`. To zestaw dotyczący obecnego zakresu, a nie deklaracja zielonej całej historycznej regresji.
- Test puli rzeczywiście zapełnia kolejne oddalone obszary, wymienia 500 odpowiedzi workera, sprawdza limit slotów/bajtów, ponowny upload CPU, zwolnienie geometrii i odrzucenie spóźnionej odpowiedzi. Osobno sprawdzono premultiplikację RGBA i zwolnienie canvasa.
- Testy zapisu wczytują znacznik awarii i sprawdzają zachowanie kadłuba, pilotów, banku i fabuły bez dodatkowych nagród. Zwykłe przerwanie nie zostaje automatycznie uznane za techniczne.
- Przeglądarka, rzeczywisty Pixi Application + MissionWorld + MissionHud: trzy pętle Mars/labirynt → Fobos → duża asteroida i ostrzał promieniami Feniksa → Fobos → Mars/labirynt. Ruch kamery i zmiana map są skryptowane, statek jest niezniszczalny na potrzeby próby. To nie ręcznie rozegrana kampania ani pomiar balansu. Rzeczywiste śluzy i ich powroty weryfikują testy Marsa.
- Pierwsza seria: trzy pętle, 1411 rasteryzacji, 22 sloty tekstur, jeden worker, bez wyjątku. JS heap miał szczyt 515 MB i spadł po GC do 184–212 MB. Wymuszone WEBGL_lose_context zatrzymało klatki, a restore odtworzyło anomalie. Dowód: `validation-v0.135/webgl-restored.png`.
- Oddzielna seria 10 restartów: jeden worker, 49 subskrypcji tekstów, około 88 żywych kontekstów grafiki i 87 tekstur po ustabilizowaniu. JS heap 146–158 MB przed ponownym wymuszeniem utraty WebGL, 106 MB po restore; szczyt serii 349 MB. Konsola nie zgłosiła ostrzeżeń ani błędów. Dowody: `restart-state.txt` i `restored-after-restarts.png` w katalogu walidacji.
- Końcowa próba po dodaniu wskazówki willReadFrequently również ukończyła trzy pętle: 1255 rasteryzacji, 20 slotów podczas lotu, jeden worker. Po zatrzymaniu na środku labiryntu pula wzrosła do 41 szczegółowych kafelków i nie przekroczyła limitu. Maksymalny zmierzony krok aktualizacji wyniósł 30 ms. Po wymuszonej utracie/odtworzeniu WebGL anomalie wróciły, JS heap po GC wyniósł 207 MB (szczyt całej próby 668 MB), konsola bez ostrzeżeń i błędów. Dowody: `final-route-state.txt` i `final-route-restored.png`.
- Pełne Core + GameSession, z magazynem zapisu zastąpionym izolowaną mapą w pamięci: utrata WebGL ustawiła znacznik zarówno w kampanii, jak i zapisanym JSON, zatrzymała ticker; restore otworzyło rzeczywistą pauzę i czas symulacji pozostał na 3,3833 s. Nowa GameSession wczytała ten zapis, usunęła przerwaną wyprawę i zachowała identyczne dane kadłuba i pilota (`reopened: true`, `preserved: true`). Bez wyjątku JavaScript. Podgląd pomija preload zasobów, więc ma ostrzeżenia o brakujących ikonach dźwięku; nie jest to błąd GPU. Dowody: `session-recovery-state.txt` i `session-recovery.png`.
- Dokowanie sprawdzono przy 50% przytrzymania F: jeden obrys fizycznej stacji, bez drugiego łuku na granicy dokowania i bez małego kółka na środku. Dowód: `validation-v0.135/single-dock-outline.png`.
- Kontrola typów, pełny lint i produkcyjny build przechodzą. JS heap jest pamięcią sterty JavaScript, nie całego Chrome ani sterownika GPU. Próby nie dowodzą braku wszystkich możliwych awarii sprzętowych.

Powtarzalny podgląd techniczny: po uruchomieniu serwera deweloperskiego wykonać `node scripts/qa-stability.mjs`, następnie otworzyć `http://localhost:3002/qa-stability.html`. Podgląd nie czyta ani nie zapisuje kampanii gracza. Ma przyciski trzech przebiegów trasy, utraty/odtworzenia WebGL, dziesięciu restartów i obrysu dokowania oraz limit bezpieczeństwa 700 MB sterty JS.
