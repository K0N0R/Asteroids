# Swobodny sektor, trwały odzysk i tło świata — 0.79

## Kierunek autora

Wyprawa otwiera sektor, a nie wybrane zadanie. Cele dostępne w świecie można wykonywać równolegle. Ta decyzja zastępuje wcześniejsze wybieranie rozkazu w lobby oraz osobne starty na ratunek.

## Wdrożone

- Usunięte przyciski wyboru misji i osobnego startu ratunkowego. Lobby pokazuje postęp, sektor i zwykły wylot, ewentualnie wylot z dostawą materiałów.
- Prom przy Księżycu i sonda przy Jowiszu pojawiają się po spełnieniu warunków sektora bez wyboru zadania. Prom może współistnieć z Mułem, budową i przejściem na powierzchnię. N przełącza nawigację między promem i Mułem, gdy obaj są dostępni. Ukończony odzysk nie odtwarza celu.
- Zwykły lot ujawnia lokalne sygnały wraków i kapsuł własnej floty. Najbliższy dostępny sygnał staje się celem podjęcia; Manta może używać obu holi. Zawartość jest rozliczana po fizycznej dostawie, niezależnie od wybranego przed startem identyfikatora.
- Nieudana wyprawa nie usuwa wcześniejszego celu ratunkowego i nie wygasza najstarszych sygnałów. Wraki przeciwników, porzucone hole oraz pozycja i stan uszkodzonego promu są zapisywane. Utrata holu ratunkowego zostawia uszkodzony cel do ponownego podjęcia. Zwykłe wraki przeciwników nadal mogą zostać fizycznie zniszczone ostrzałem.
- Panel Ratunek ma charakter informacyjny: położenie sygnału, zawartość i powrót do dowodzenia. Nie wybiera celu wyprawy.
- Instruktor wydobywa najwyżej dwie jednostki rudy i czeka przy złożu. Pokaz daje rzeczywisty urobek, który gracz sam zbiera. Po pojedynczym ostrzeżeniu o odległości instruktor ignoruje zasięg gracza, nie odgrywa rozmowy o odzyskaniu kontaktu. Jego ruch i laser, a także ruch i wydobycie Muła, uczestniczą w miksie z tłumieniem odległości.
- Nowa pętla napędu z filtrowanego szumu `sfx_loops/noise_01.ogg`: 3,96 s, filtr 55–420 Hz, płynne łączenie. Usunięty metaliczny charakter `machine_06`. Wszystkie przygotowane efekty zajmują 234 772 bajty; źródła CC0 i manifest SHA-256 pozostają w dokumentacji audio.
- Poprawione podpisy świata: środkowy punkt tekstu jest przypisany do obiektu, a odstęp od obiektu i układ kilku wierszy uwzględniają obrót kamery.
- Planety mają kotwice w przestrzeni sektora i są rzutowane przez pozycję, obrót oraz skalę kamery. Usunięte nadpisywanie ich pozycji przez aktualizację trybu lotu. Księżyc jest osadzony przy wejściu na powierzchnię. Ilustracja planety nie obraca się wokół własnej osi podczas skręcania — kierunek kamery zmienia jej położenie na ekranie.
- Usunięte duże owalne łuny. Zamiast nich jest pas gwiazd i pyłu Drogi Mlecznej widzianej od środka oraz trzy drobne sylwetki odległych galaktyk. Tło zachowuje paralaksę i orientację względem świata.
- Podejście do Księżyca powiększa ten sam model globu, bez obrotu ilustracji wokół własnej osi, aż do odsłonięcia powierzchni; powrót odwraca ruch. Pozostałe planety nadal nie mają osobnych instancji powierzchniowych — dodanie ich wymaga zawartości i wejść w sektorach.

## Zapis

**Kampania 48, dziennik 21. Wymagany nowy zapis.** Dodane `worldSalvage`, `nextSalvageId` i `rescueSites`. Nie ma migracji starszego formatu, zgodnie z decyzją autora.

## Weryfikacja

Regresje obejmują swobodny odzysk kilku sygnałów, zachowanie wraku po stracie i kolejnym wylocie, wspólny sektor promu i Muła, zerwany hol, przejścia powierzchniowe, realną obronę bazy z niezależnymi kontaktami w sektorze, limit pokazu instruktora, słyszalność AI oraz projekcję planety bez ponownego przyklejania do rogu ekranu. Profil wizualny używa osobnych kluczy QA i przygotowanego podejścia do Księżyca.

Wynik weryfikacji: **520/520 testów**, typecheck, ESLint i build produkcyjny. Kontrola przeglądarkowa obejmuje lobby bez wyboru misji, informacyjny widok odzysku, orbitę i powiększanie globu podczas przejścia na powierzchnię; bez błędów konsoli.
