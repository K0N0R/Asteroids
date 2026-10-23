# Plan: tiery statków, zdolności, holowanie i sterowanie

Stan: 2026-10-23. **Mechaniki wdrożone w roboczej wersji 0.131.0; pełna regresja i strojenie pozostają otwarte.** [Stan implementacji](implementation-v0.131.md). Wspólne koszty materiałów i kolejność zakładów: [plan gospodarki](station-progression-rebalance-plan.md).

Podział floty, wymienione uzbrojenie oraz zmiany klawiszy pochodzą od autora. Koszty kadłubów, parametry odnowienia, szczegóły efektów i sposób rozwoju holowania poniżej są propozycją pierwszego balansu.

## 1. Podział floty i otwieranie projektów

| Tier | Statki | Zdolności dostępne z rolą |
| --- | --- | --- |
| 0 | Prospector | Tylko istniejące wyposażenie startowe, bez produkcji i ulepszeń |
| I | Swift, Muł, Manta, Bastion, Harpun | LPM i PPM |
| II | Sokół, Widmo, Atlas | LPM, PPM i Q |
| III | Aegis, Żądło, Feniks | LPM, PPM, Q i E |

Otwarcie Warsztatu I udostępnia jednocześnie wszystkie pięć projektów I; Warsztatu II — wszystkie trzy II; III — wszystkie trzy III. Laboratorium danego poziomu wcześniej otwiera potrzebne materiały, a Warsztat uruchamia ich zastosowanie w częściach i kadłubach. Projekt nie wymaga oddzielnego zadania, reputacji ani odprawy kadłuba.

Usunąć obecne odblokowania kadłubów przez `mars-shields`, `earth-debrief`, `venus-build`, `venus-shield`, `mercury-technology`, `mars-base-build`, `belt-exit` i `jupiter-observations`. Badania Merkurego/Jowisza nadal mogą otwierać **poziomy gospodarki**, lecz nie są osobnymi flagami poszczególnych statków. Tarcza Marsa realizuje wyłącznie swój projekt stacji.

Wyjątkiem jest jednorazowa nagroda w postaci ocalałego Muła po misji księżycowej. Daje statek przed Warsztatem I, ale nie jego przepis. Raider i Lancer pozostają specjalnymi kadłubami odzysku, poza katalogiem nowych projektów produkcyjnych; nie dopisujemy im nowych przypisań tieru bez potrzeby kampanii.

Zdolności przypisane do kadłuba działają od jego zbudowania. Q/E nie wymagają kolejnego questa ani kupienia umiejętności. Ulepszenie modułu nie nadaje niższemu kadłubowi dodatkowych slotów zdolności.

## 2. Prospector 0 i procedura awaryjna

- Startowa/awaryjna jednostka, bez przepisu, kupna i budowy w Stoczni.
- Wszystkie moduły, ulepszenia i płatne warianty uzbrojenia zablokowane. W Hangarze czytelny opis roli zamiast aktywnego przycisku modernizacji. Zwykłe naprawianie uszkodzeń nie jest ulepszaniem.
- Nie dostaje adaptera ekstrakcji anomalii ani prototypów zwiększających parametry lub dodających zdolności. Tymczasowy przedmiot fabularny na holu pozostaje możliwy.
- Jeśli nie ma żadnego dostępnego statku, awaryjna procedura daje jednego Prospectora 0. Nie sprawdza materiałów dawnego przepisu, nie tworzy stosu darmowych kadłubów i najpierw pozwala wybrać istniejącą jednostkę rezerwową.
- Darmowy statek nie zwraca części przy recyklingu ani sprzedaży. Utracony Prospector nadal nie pozostawia odzyskiwalnego kadłuba; kapsuła pilota może przetrwać zgodnie z obecną zasadą.
- Początek i cała pierwsza misja księżycowa są grywalne bez jego ulepszeń. Po stracie płatnej floty gracz nadal może zebrać nim zwykłe pierwiastki na odbudowę statku I.

## 3. Tier I — role i sterowanie bojowe

| Statek | LPM | PPM | Rola i wyposażenie |
| --- | --- | --- | --- |
| Swift | Dotychczasowe działko | Dotychczasowy laser wydobywczy | Szybki, lekki zwiadowca; pozostałe parametry i rola bez zmian |
| Muł | Dotychczasowe dwa lasery | Dotychczasowa samonaprawa | Ciężki, pojemny zbieracz; samonaprawa bez zestawów i surowców |
| Manta | Działko | Granaty EMP | Ciężki opancerzony bojowy holownik; brak lasera wydobywczego; 2 bazowe sloty holowania, rozwijane dalej |
| Bastion | Dotychczasowe działko | Granaty wybuchowe | Średni statek bojowy na bliski i daleki dystans; zachować rolę i pozostałe parametry |
| Harpun | Dotychczasowa akcja główna szczypców | Dotychczasowa akcja dodatkowa szczypców | Statek zadaniowy; zachować unikalne ramiona i sposób pracy |

Manta zachowuje ciężar i odporność wyraźnie większe od Bastiona; startowym punktem odniesienia jest obecny profil 230 kadłuba, 80 tarczy i 280 prędkości. Moc zwykłego działka nie powinna jednocześnie przewyższać Bastiona: jej przewaga to kontrola pola i holowanie. Nie ma Q/E mimo obecności EMP na PPM.

Działko Manty przenosimy **na ogon, na osi symetrii w środkowej dolnej części ilustracji**. Punkt emisji i grafika mają być tym samym hardpointem, obracanym razem z kadłubem. Nie wolno interpretować „na dole” jako stałego dołu ekranu ani zostawić starego bocznego działka. Kąt prowadzenia ognia pokazać w podglądzie przed ostatecznym ustaleniem współrzędnych.

Harpun jest dostępny już przy otwarciu tieru I; specjalne skały, cele i technologia wydobycia nadal mogą wymagać odpowiedniego odkrycia. Wcześniejsza dostępność statku nie otwiera przedwcześnie Merkurego ani ekstrakcji anomalii.

## 4. Tier II — trzy nowe zestawy z Q

| Statek | LPM | PPM | Q | Rola |
| --- | --- | --- | --- | --- |
| Sokół | Obecne działka | Obecny laser | Granat EMP taki jak Manty | Uniwersalny statek bojowy; Q daje kontrolę przeciwników |
| Widmo | Nowe działko na dziobie | Ofensywny dash | Kamuflaż optyczny | Zwiad, podejście i uderzenie; zmiana obecnego układu LPM-dash/PPM-kamuflaż |
| Atlas | Rakieta | Granaty wybuchowe | Shockwave | Grenadier; wspólny system eksplozji i odpychania |

PPM Sokoła nie został zmieniony przez autora; zachowujemy istniejący laser. Dodatkowe atuty skanowania i terminali są osobnym parametrem roli, bez odbierania wskazanego uniwersalnego uzbrojenia. Widmo potrzebuje realnego dziobowego hardpointu, pocisku, odrzutu i efektu wystrzału; sama zamiana podpisów nie wystarczy.

Atlas zachowuje odróżniającą go mechanikę rakiety i granatów. Shockwave jest osobną zdolnością Q, a nie zamianą PPM. Tiery II nie dostają zdolności pod E.

## 5. Tier III — Q i E

| Statek | LPM | PPM | Q | E |
| --- | --- | --- | --- | --- |
| Aegis | Działko energetyczne | Dwa krótkie lasery wydobywcze po bokach | Wzmocnienie tarcz | Shockwave jak Atlasa |
| Żądło | Rapid fire | Rakieta | Niewidzialność | Granaty EMP |
| Feniks | Dwa działka po bokach skrzydeł | Dwa średnie promienie podpalające wrogów | Rakieta jak Atlasa | Shockwave |

Aegis ma **dwa chwytaki zbierające**. To nie oznacza automatycznie dwóch slotów holowania: zbieranie surowców i holowanie wraków mają oddzielne parametry. Jego krótkie boczne lasery wymagają bliskiego podejścia; nie zastępują zasięgu wyspecjalizowanego górnika. Obecny system osobnego drona wsparcia Aegisa nie staje się dodatkową ukrytą zdolnością; nowy zestaw zastępuje sprzeczne dotychczasowe funkcje.

Żądło ma najwyższą presję ogniową kosztem odporności. Kamuflaż i EMP dają krótkie okna przeżycia, nie stałą nietykalność. Feniks jest bardziej uniwersalny: ogień ciągły, podpalenie, pocisk i kontrola obszaru. Jego promienie służą do walki, nie dostają automatycznie wydobycia tylko dlatego, że obecny projektor w kodzie także wydobywał.

## 6. Wspólne zdolności i pierwszy balans

Wspólne zdolności powinny mieć jedną definicję oraz implementację efektu, niezależnie od statku i slotu przycisku. Poniższe liczby są propozycją do testów, nie ustaleniem autora. Jednostki zasięgu odnoszą się do tej samej skali świata co obecne pociski.

| Efekt | Propozycja bazowa | Zasady |
| --- | --- | --- |
| Granat EMP | Promień 160, blokada ataku 2,5 s, odnowienie 6 s | Wspólne dla Manty, Sokoła i Żądła; nie odbiera przeciwnikowi możliwości ruchu |
| Shockwave | Promień 260, 70 obrażeń statkom, odnowienie 12 s | Wspólne dla Atlasa, Aegisa i Feniksa; silny impuls asteroidom |
| Kamuflaż | 3 s działania, 12 s odnowienia | Wspólne dla Widma i Żądła; utrata namierzenia, bez nietykalności |
| Wzmocnienie tarcz | 6 s, dodatkowy bufor 80, odnowienie 18 s | Tylko Aegis; po wygaśnięciu usuwa niewykorzystany bufor, bez stałego mnożenia tarczy |
| Rakieta | Obecny pocisk Atlasa: bazowo 160 obrażeń, promień eksplozji 180 | Wspólna fizyka, naprowadzanie i efekt; częstotliwość zależy od slotu uzbrojenia |
| Podpalenie | 4 s, 8 obrażeń/s na cel | Dwa promienie odnawiają czas jednej instancji, nie zakładają nieskończonych stosów |

Na start zachować obecny interwał rakiety Atlasa 1,8 s na LPM. Rakieta Żądła na PPM: proponowane 4 s; Feniksa na Q: 8 s. To ten sam pocisk i model obrażeń, ale różny budżet całego zestawu. Ostateczne interwały ustalić próbami obrażeń, liczby trafień i czasu przeżycia. Granaty wybuchowe Bastiona/Atlasa zaczynają od obecnej definicji; nie dostają EMP jako dodatkowego efektu.

EMP:

- Wyłącza atakowanie wrogich jednostek na czas efektu; nie zadaje obrażeń skałom ani asteroidom, nie daje urobku i nie rozbija ich na fragmenty.
- Nadaje dynamicznym asteroidom impuls od środka wybuchu, zależny od masy i odległości. Wspólna droga obliczania impulsu z shockwave, z osobną siłą.
- Nie usuwa już wystrzelonych pocisków i nie jest trwałym przejęciem AI. Kolejny EMP odnawia ograniczony status zamiast sumować czasy bez końca.
- Proponowana odporność po zakończeniu efektu: 2 s. Bossowie: skrócona blokada 0,8 s i czytelna informacja o odporności, bez pomijania faz skryptowych.

Shockwave:

- Zadaje jednorazowe obrażenia wrogim statkom w promieniu i silnie odpycha dynamiczne asteroidy. Asteroidy nie dostają bezpośrednio obrażeń od zdolności.
- Przemieszczona skała może uderzyć przeciwnika i zadać obrażenia kolizji. To wymaga obsługi kontaktu skała–wróg, a nie tylko efektu graficznego. Trafienie ma jedną instancję obrażeń i przypisanie sprawcy dla misji, bez farmienia wielokrotnych nagród.
- Nie rusza przytwierdzonych instalacji, geometrii misji i aktywnego holu gracza. Obrażeń bezpośrednich nie dostają sojusznicy; fizyka skał pozostaje spójna ze zwykłymi kolizjami.

Kamuflaż nie usuwa pocisków, kolizji ani obrażeń środowiska. Atak działkiem, dash, rakieta, granat lub ofensywna fala przerywają efekt. Zdolność nie kasuje zapisanego alarmu. Aegis nie otrzymuje trwałej tarczy przez wielokrotne odświeżanie Q; bufor ma jednoznaczne wygaśnięcie.

## 7. Manta: holowanie 2 → 5 obiektów

Autor ustala dwa bazowe sloty i rozwój ponad dwa. Propozycja wykorzystuje moduł sterowania Manty zamiast kolejnego osobnego systemu kupowanych części:

| Poziom sterowania Manty | Liczba slotów holowania | Koszt i dostępność |
| --- | --- | --- |
| 0 | 2 | Wbudowane w kadłub I |
| I | 3 | 1 napęd I + 1 elektronika I; Warsztat I |
| II | 4 | 1 napęd II + 1 elektronika II; Warsztat II |
| III | 5 | 1 napęd III + 1 elektronika III; Warsztat III |

Podgląd modułu pokazuje zarówno efekt manewrowy, jak i hol 2 → 3 itd. Manta nie zmienia tieru kadłuba po montażu modułu. Muł nadal jest pojemniejszym i lepszym górnikiem; Manta nie uzyskuje lasera przez modernizację.

Obecne `SalvageFleet` obsługuje kolekcję holowanych obiektów, lecz wyznacza kotwice praktycznie tylko dla dwóch pozycji. Wdrożenie 3–5 wymaga osobnych kotwic, odstępów, masy i oporów całego zestawu oraz indeksowanego wyboru holu. Nie wystarczy zwiększyć `capacity`.

Paczka księżycowa, moduł pamięci, wrak, kapsuła i inne cele zadaniowe współdzielą **jeden limit holowania**. Nie można osobnymi systemami podpiąć więcej niż wynika z konfiguracji. W HUD licznik np. 2/4 i lista obiektów; odpinanie wskazanego obiektu i jawna akcja odpięcia wszystkich, bez przypadkowego wyrzucenia wymaganego modułu.

Każdy hol zachowuje własne ID, stan i dostawę przy przelocie śluzą, lądowaniu, powrocie, rozliczeniu straty oraz zapisie obiektów porzuconych w świecie. Przesyłki nie zaliczają się kilka razy. Animacja musi przenieść cały zestaw bez uszkodzeń od skoku położenia i bez pozostawienia jednego obiektu na poprzedniej mapie.

## 8. Nowe sterowanie — ustalenia autora

| Wejście | Funkcja |
| --- | --- |
| LPM | Główne uzbrojenie / narzędzie przypisane do statku |
| PPM | Dodatkowe uzbrojenie / narzędzie |
| Q | Zdolność statków II i III |
| E | Druga zdolność statków III |
| F | Wszystkie interakcje świata, także śluzy |
| Spacja | **Brak przypisania; usunięta obsługa dotychczasowego skoku** |
| K | **Brak przypisania; całkowity unbind** |

Interakcja F obejmuje dok, sondy, terminale, wraki, podpinanie holu, powierzchnie, bazę księżycową, instalacje i śluzy. E nie ma już zapasowej funkcji interakcji. Q/E nieuruchomione przez kadłub nie robią nic.

Śluza ma etykietę z nazwą/kierunkiem i podpowiedzią F w zasięgu. Usuwamy K ze wszystkich etykiet, instrukcji, odczytów i HUD oraz kod wyznaczania śluzy po K. Spacja nie ładuje napędu, nie anuluje przelotu, nie uruchamia skoku po kursie i nie pozostaje ukrytym aliasem. Nie zastępujemy tego innym klawiszem swobodnego skoku.

Przy całkowitym odpięciu Spacji usuwamy też jej dotychczasowe przewijanie dialogów; pozostają Enter i przycisk ekranowy. Stare zapisane przypisania Spacji/K nie mogą odtwarzać tych akcji po uruchomieniu gry.

**Animowane przeloty śluzami pozostają.** Ich uruchomienie przenosimy do systemu interakcji F. Propozycja: wskazana pobliska śluza → przytrzymanie F przez 2 s → istniejący przelot. Jedno przytrzymanie nie aktywuje od razu śluzy powrotnej; po transferze wymagane zwolnienie F i nowe naciśnięcie. Poza zasięgiem śluzy F nie powoduje skoku.

Rozstrzyganie nakładających się interakcji:

- System ustala jeden aktualny cel i pokazuje go w HUD. Pierwszeństwo ma cel wskazany kursorem i będący w zasięgu, następnie najbliższy kwalifikujący się obiekt; jawny wybór chroni przed przypadkowym wejściem w śluzę zamiast podjęcia holu.
- Po rozpoczęciu przytrzymania cel jest zablokowany do zakończenia lub anulowania; utrata zasięgu przerywa, bez automatycznego przejścia na inny obiekt.
- Terminale/minigry, modalne UI i przejścia przejmują input zgodnie ze swoim stanem. Podczas transferu Q/E nie odpalają zdolności, a zakończenie przejścia nie wykonuje zaległego naciśnięcia.
- Zdolności Q/E działają na nowe naciśnięcie, bez powtarzania systemowego klawiatury; przytrzymanie nie odpala ich automatycznie po odnowieniu. Broń LPM/PPM zachowuje tryb odpowiedni dla narzędzia.
- Utrata fokusu czyści input F/Q/E i LPM/PPM. Nowe klawisze są obsługiwane spójnie niezależnie od układu klawiatury oraz panelu UI.

Pozostałe klawisze ruchu, transferu i napraw zachowują swoje role, o ile nie kolidują z powyższym. Audyt obejmuje szczególnie dotychczasowe kombinacje interakcja+sabotaż: teraz F+G zamiast E+G.

## 9. Koszty projektów kadłubów

Punkt wyjścia: zachować obecne liczby rodzin części, zastosować nowe receptury oraz wymagany tier. To konkretna pierwsza tabela do prób, nie finalne wyrównanie siły statków. Wartości dotyczą każdej części we wskazanym tierze; PS/PL to poszycie stalowe/lekkie, E elektronika, M maszyneria, Ż podtrzymywanie życia, N napęd, Z zasilanie.

| Statek | Tier | Poszycie | E | M | Ż | N | Z |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Swift | I | 3 PS | 2 | 1 | 1 | 2 | 1 |
| Muł | I | 10 PS | 2 | 8 | 2 | 2 | 3 |
| Manta | I | 10 PS | 2 | 6 | 2 | 2 | 2 |
| Bastion | I | 6 PS | 3 | 3 | 1 | 2 | 2 |
| Harpun | I | 8 PS | 3 | 7 | 1 | 2 | 3 |
| Sokół | II | 5 PL | 5 | 3 | 1 | 3 | 3 |
| Widmo | II | 6 PL | 6 | 4 | 1 | 3 | 4 |
| Atlas | II | 14 PS | 4 | 10 | 2 | 4 | 4 |
| Aegis | III | 9 PS | 6 | 5 | 2 | 2 | 6 |
| Żądło | III | 6 PL | 5 | 3 | 1 | 3 | 3 |
| Feniks | III | 8 PL | 6 | 4 | 1 | 4 | 5 |

Prospector nie występuje w tej tabeli i nie może wrócić do niej przez automatyczne generowanie wszystkich `HullId`. Funkcje kosztu muszą umieć opisać „nieprodukowany”, zamiast wymagać fikcyjnego kosztu zero.

Moduły I/II/III kosztują części dokładnie tego poziomu i wymagają odpowiedniego Warsztatu. Bazowe liczby: silnik 2 N + 1 M; sterowanie 1 N + 1 E; ładownia 2 PS + 2 M; narzędzie 2 E + 1 Z; pancerz 4 PS + 1 M; tarcza 1 E + 2 Z. Nazwa i opis modułu narzędzia są dopasowane do roli, bez oferowania Mantcie „ulepszenia lasera”. Prospector nie ma tych ofert.

Płatne warianty broni nie mogą zamieniać przypisanych przez autora LPM/PPM/Q/E ani nadawać zdolności wyższego tieru. Dotychczasowe premie wariantów wymagają audytu po rozdzieleniu wspólnych efektów; nie mnożyć jednym mnożnikiem jednocześnie siły EMP, długości niewidzialności i obrażeń całej salwy.

## 10. Prace implementacyjne i próby

1. Jawne `hullTier`, produkowalność i zestaw zdolności w konfiguracji; otwieranie projektów przez Warsztat, brak tablicy questów kadłubów. Procedura awaryjna i UI Prospectora 0.
2. F dla interakcji i śluz, nowe sloty Q/E, całkowite odpięcie Spacji/K, przepływ inputu do symulacji i HUD. Zaktualizować etykiety, instruktor, dialogi, tutorial, sandbox i dokumentację sterowania.
3. Wspólne definicje broni/zdolności z osobnymi cooldownami slotów. Wydzielać mechaniki z dużej symulacji zamiast dopisywać serię sprzecznych wyjątków dla każdego `HullId`.
4. Tier I: rola Manty, hardpoint na ogonie, EMP, holowanie 2–5; zachowanie Swifta/Muła/Bastiona/Harpuna. Nagroda Muła i start bez Warsztatu zgodnie z planem gospodarki.
5. Tier II: Sokół Q, dziobowe działko i zmiana slotów Widma, shockwave Atlasa. Następnie nowe zestawy III i grafika hardpointów.
6. Podglądy Hangaru: osobno parametry, budowa, moduły, zdolności z klawiszami i rzeczywistymi cooldownami. Koszt, strona efektów, sloty holowania i ilustracja muszą odpowiadać symulacji.

Kryteria odbioru:

- Otwarcie tieru udostępnia dokładnie 5/3/3 projekty, bez sprawdzania dawnych questów. Muł nagrody najwyżej raz, brak produkcji i modernizacji Prospectora we wszystkich wejściach API/UI.
- Każdy statek ma dokładnie uzgodnione LPM/PPM/Q/E; brak osieroconych dawnych zdolności. Aegis ma dwa chwytaki, Manta zero laserów; hardpointy odpowiadają grafice i miejscu emisji.
- F obsługuje każdy typ interakcji i obie strony każdej śluzy. E używa wyłącznie zdolności III. K i Spacja nie zmieniają stanu także po ponownym starcie, w sandboxie i po odczycie dawnych preferencji klawiszy.
- Podpowiedzi śluz bez K/Spacji, stabilny cel interakcji, poprawne anulowanie i konieczność zwolnienia F po transferze. Wszystkie odwołania do dawnego E w dialogach i HUD poprawione.
- EMP zatrzymuje ostrzał na czas, nie zadaje obrażeń skałom, odpycha je i nie daje urobku. Shockwave trafia raz, przemieszcza dynamiczne skały i pozwala uszkodzić przeciwnika ich kolizją.
- Wspólny kamuflaż obu statków, poprawne przerwanie atakiem, brak nietykalności. Wzmocnienie tarczy wygasa bez trwałego przyrostu; podpalenie nie mnoży się bez limitu od dwóch promieni.
- Pięć holi Manty w różnych kolejnościach podpięcia/odpięcia, wspólny limit z obiektami fabularnymi, śluzy, lądowanie, dostawa, strata i odtworzenie porzuconych obiektów. Brak zdublowania ładunku oraz nagród.
- Wyłączenie zdolności w modalach, animacji i po utracie fokusu. Brak zaległego strzału po powrocie.
- Próby każdego kadłuba przeciw pojedynczemu przeciwnikowi, grupie, ciężkiemu celowi i polu asteroid, na modułach 0 oraz dostępnych I/II/III. Mierzyć czas zabicia, przeżycie i pokrycie pola kontrolą, nie tylko DPS.
- Ciągłe przejście kampanii: Księżyc na Prospectorze 0; Mars–Merkury na I bez Sokoła/Widma; do Jowisza na II bez Aegisa/Żądła/Feniksa. Obowiązkowe minigry muszą być wykonalne bez statku późniejszego tieru.

Główne miejsca: `frontend/core/systems/inputHandler.ts`, `frontend/game/{config,session}.ts`, `systems/{mission,salvage,tow,enemies,aegisSupport,harpoonArms}.ts`, stan kampanii/floty/modułów, HUD i odczyty misji, grafika statków oraz przejść. Przy implementacji wykonać ukierunkowane testy inputu, walki, gospodarki, holowania i odzysku, kontrolę typów oraz build.
