# 0.132 — poprawki po testach od początku kampanii

Stan: 2026-10-24. Wersja aplikacji 0.132.0. Format zapisu pozostaje 67, dziennik 32; pole radia jest opcjonalne, więc zapis 0.131 nadal działa.

## Interakcje i podróże

- F obsługuje interakcje świata, śluzy, skany, dokowanie, budowy i połączenia z terminalami. H obsługuje wszystkie rodzaje holu: wraki, paczki, cele ratunkowe i zabezpieczone promy/sondy. J zwalnia hol. Spacja i K pozostają bez przypisania.
- Wspólne przytrzymanie trwa 1 s, również przy śluzach i bazie księżycowej. Okrąg korzysta z rzeczywistego postępu aktywnej operacji i zachowuje wielkość ekranową przy zmianie zoomu. Przerwanie zeruje postęp; utrata celu wymaga puszczenia klawisza.
- Lądowanie i powrót mają znacznik z pierścieniami orbitalnymi, padami podejścia i światłami zamiast zielonej strzałki. Usunięto stare E z opisów księżycowych i mylące 1 przy powrocie z Fobosa.
- Zaliczony przekaźnik i sonda księżycowa są odtwarzane w stanie kolejnej wyprawy; nie wymagają ponownego strojenia.

## Łączność i dziennik

- Komunikaty fabularne, raporty, instruktor i komentarze odkryć korzystają z jednego panelu łączności. Gra działa w tle; panel nie przejmuje sterowania ani nie otwiera pauzy.
- Wiadomość czeka na kliknięcie lub Enter. Najpierw można odsłonić tekst, następnie przejść dalej. Wysokość panelu dostosowuje się do długości akapitu.
- Nieprzeczytana kolejka oraz identyfikatory potwierdzonych wiadomości są zapisywane w kampanii. Powtórzenia są odrzucane. Przestarzałe odprawy wczesnych etapów pomijamy po wykonaniu opisywanego celu.
- Krótkie informacje operacyjne mają osobną etykietę „INFO · ZNIKA AUTOMATYCZNIE” i pasek czasu. Łączność wymaga potwierdzenia i ma własne oznaczenie.
- Gdy nie ma aktywnych zadań, panel wyprawy pokazuje następny krok fabuły i przycisk otwierający Układ słoneczny.

## HUD i stacja

- Lewy dolny róg: duże koła LPM/PPM/Q/E dostępnych na danym kadłubie, przypisanie klawisza przy ikonie, stan odnowienia oraz tooltip z opisem i stanem właściwego ulepszenia/wyposażenia.
- Pasywy stoją na prawo od aktywnych zdolności, bez przypisania klawisza: wykrywalność, hol i nielimitowane naprawy Muła. Muł ma aktywne lasery na LPM; naprawę wykonuje R. Usunięto błędne PPM w starym HUD.
- Pozostałe sterowanie jest w dwóch wierszach w prawym dolnym rogu.
- Podgląd zamontowanego poziomu Laboratorium/Warsztatu pokazuje działające odblokowania i stan zamontowania, bez receptury, kosztów i komunikatu o brakującym poprzednim poziomie.

## Mars, rendering i audio

- Szczegółowe kafelki anomalii zachodzą na siebie i mają miękkie krawędzie. Zapobiega to prostokątnemu odcięciu przy oczekiwaniu na sąsiedni kafelek.
- Limit 64 aktywnych kafelków, ograniczenie zakresu przy skrajnym/niepoprawnym zoomie, jedna publikacja tekstury na klatkę. Brak odpowiedzi workera przez 4 s przełącza na lżejszy raster zastępczy; spóźnione odpowiedzi są zwalniane.
- Pętle maszyn otrzymują odnawiane potwierdzenie pracy. Wygaszanie jest planowane na zegarze WebAudio (zapas 350 ms, cisza po 500 ms), więc nie wymaga wykonania callbacku JavaScript przy zablokowaniu głównego wątku. Po zatrzymaniu aktualizacji są wyciszane/zatrzymywane; po wznowieniu powstaje aktualny uchwyt zamiast użycia zakończonego dźwięku. Tier 0–III ma odrębną wysokość dźwięku silnika; boost i awaria modyfikują profil.
- W przeglądarkowej próbie na anomalii Marsa świat działał ponad 200 s z otwartą wiadomością: 35 szczegółowych kafelków, 36 zasobów rastrowych, 14 885 888 pikseli, maksymalna zmierzona aktualizacja 34 ms. Dźwięk w tym technicznym podglądzie był wyłączony; jego cykl życia i profile sprawdzają testy logiki audio.
- Nie odtworzono dokładnej sekwencji dwóch powiadomień ze zgłoszonego zawieszenia. Usunięto blokowanie gry przez radio oraz poprawiono odporność renderowania i audio; pełny przebieg kampanii pozostaje osobnym testem ręcznym.

## Weryfikacja

**195/195 testy zestawu akceptacyjnego przechodzą.** Kontrola typów, lint zmienionych plików i build produkcyjny przechodzą. Raporty: `dist/feedback-verified.txt`, `dist/feedback-lunar-final.txt`, `dist/feedback-typecheck.txt`, `dist/feedback-lint.txt`, `dist/feedback-build.txt`. Dodatkowy zestaw audio/łączności: `dist/feedback-audio-final.txt`. Zestaw akceptacyjny obejmuje progresję, receptury, zakłady, walkę, księżycowe obrony, holowanie H, śluzy 1 s, radio z zapisem/odczytem, audio, input, streaming anomalii, radar i Fobosa.

Starsza pełna regresja nadal zawiera błędy opisane w raporcie 0.131; nie jest deklarowana jako zielona. Testy zmienione w tym etapie dostosowano do nowych czasów, H oraz obecności surowców faktycznie wydobytych podczas walki.

Podglądy UI: `dist/feedback-radio-hud.png`, `dist/feedback-mule-passive.png`, `dist/feedback-phoenix-abilities.png`, `dist/feedback-gate-progress.png`. Pliki w dist są artefaktami roboczymi i nie trafiają do repozytorium.
