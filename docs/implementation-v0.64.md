# Implementacja 0.64 — drony strażnicze Satuk 15

## Hangar

**Stacja → Przemysł → Ochrona Satuk 15 → Drony strażnicze**. Montaż wymaga ukończonego zaplecza ziemskiego, warsztatu I, generatora tarczy i mechanika pracującego w stacji. Koszt jednorazowy: **40 Fe, 12 komponentów, 3 moduły zasilania**. Pakiet zawiera trzy jednostki po **80 HP**. Nie można montować podczas wyprawy ani kupić hangaru ponownie. Brak składników nie powoduje częściowego pobrania kosztu.

## Patrol i walka

Trzy niezależne jednostki patrolują w odległości około **1080 m** od stacji, poza tarczą 850 m. Obszar działania kończy się na **1550 m**. Garnizon towarzyszy Satuk 15 na orbicie w kolejnych sektorach; nie podąża za graczem ani nie osłania powierzchni, placówek i odległych zadań. Tryb testowy i dotychczasowe scenariusze sandboxa nie otrzymują automatycznego garnizonu.

Wykrywanie: **650 m od drona**, wyłącznie celów w obszarze działania i bez fizycznej przeszkody na linii widzenia. Cel jest utrzymywany do utraty kontaktu. Dron podchodzi do celu, strzela rzeczywistymi pociskami za **9 obrażeń co 0,8 s**, do **520 m**, i wraca na patrol po zerwaniu kontaktu. Prędkość: **210 m/s**. Ominięcie przeszkód i kolizje korzystają z Rapiera.

Przeciwnicy mogą wybierać drony jako cele zamiast gracza. Wrogi ostrzał i zderzenia poza tarczą uszkadzają garnizon; własne pociski nie trafiają sojuszników. Drony nie wydobywają skał. Tarcza stacji zatrzymuje pociski według dotychczasowych zasad, więc patrol poza jej granicą nie jest nietykalny. Impuls Aegisa może dodatkowo osłonić pobliskich strażników. Zniszczenia wrogów przechodzą wspólne rozliczenie walki, bez nowego rodzaju nagród.

## Naprawa i odbudowa

Przy **35% kadłuba lub mniej** dron przerywa walkę i wraca do hangaru. Mniejsze uszkodzenia kierują go do serwisu po **8 s bez kontaktu**. W promieniu doku 260 m wolny mechanik naprawia **4 HP/s**, bez materiałów. Powrót do patrolu dopiero z pełnym kadłubem. Trafienie lub wykrycie przeciwnika zeruje czas spokoju.

Zniszczona jednostka wymaga **2 komponentów i 1 modułu zasilania**, pobranych jednokrotnie na początku **30 s odbudowy**. Brak zasobów lub wolnego mechanika wstrzymuje rozpoczęcie. Opłacona odbudowa zachowuje pozostały czas; ponowny wylot nie nalicza kosztu drugi raz. Mechanik na pokładzie lub przy zleceniu przemysłowym nie serwisuje garnizonu. Naprawa i odbudowa działają wyłącznie w czasie symulacji na orbicie, nie w lobby, pauzie, transferze ani na powierzchni. Brak osobnej gospodarki energią i produkcji offline.

## Widok i zapis

Hangar pokazuje koszt, parametry oraz kadłub lub czas odbudowy każdego z trzech strażników. Modele mają własną metaliczną sylwetkę, miętowe oznaczenia, animowany napęd i pasek kadłuba; radar oznacza sojuszników rombami.

Format kampanii **41**, dziennika **19**, bez migracji. Zapisy przechowują kadłuby i opłacony czas odbudowy; strata statku gracza nie usuwa hangaru ani nie odnawia dronów. Nadal nie wznawiamy aktywnej wyprawy po odświeżeniu.

## Weryfikacja

**429/429 testów**, bez pominięć. Typecheck, lint, produkcyjny build i `git diff --check` przechodzą.

Siedem testów pakietu obejmuje montaż, koszty i blokady, ścisłą walidację zapisu, limit i zasięg patrolu, wykrywanie, rzeczywistą przeszkodę, walkę z AI przy graczu pod tarczą, rozróżnienie stron pocisków, naprawę, zasoby i czas odbudowy, zajętego mechanika, powierzchnię oraz zachowanie garnizonu po porażce. Pełne przejście i balans kampanii od nowego zapisu pozostają odrębnym etapem; te próby używają przygotowanego legalnego postępu.

Przeglądarka na osobnym porcie: uruchomienie wydania, montaż przez akcję panelu z dokładnym pobraniem kosztów, trzy wyrenderowane i poruszające się jednostki, starcie z rzeczywistym przeciwnikiem, wybór strażnika przez AI, wzajemne obrażenia oraz zakończenie wyprawy dokowaniem. Odczyt pikseli WebGL potwierdza niepustą klatkę. Sprawdzono układ renderera 1600×900 oraz 390×844 bez wyjścia tekstu panelu poza ekran; widok mobilny zachowuje istniejące skalowanie całej gry, nie wprowadza osobnego sterowania dotykowego. Brak zarejestrowanych błędów JavaScript podczas próby. Zrzuty narzędziowe dużego widoku były ograniczane obszarem hosta przeglądarki, więc geometrię panelu sprawdzono również bezpośrednio przez granice elementów Pixi. To krótka próba z przygotowanym postępem i lokalnym przeciwnikiem, nie pełne ręczne przejście kampanii ani test większych fal.

## Następny pakiet

Role przeciwników: przechwytujący, ciężka jednostka nacisku, wsparcie naprawcze i stawiacz min. Większe mieszane obrony baz pozostają kolejnym etapem. Nie zmieniono scenariusza ani fabularnego finału aktu I.
