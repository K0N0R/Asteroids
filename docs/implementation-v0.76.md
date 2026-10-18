# Wersja 0.76 — nowe efekty i kontrola miksu

Data: 2026-10-18. Format kampanii 47 i dziennika 21 pozostaje aktualny.

## Przegląd i wymiana

Przejrzano sześć paczek w `E:/Projects/asteroids-sounds`: 206 nagrań, ich formaty, metadane autorów, długości, szczyty, RMS i cisze. Wszystkie nagrania zostały zdekodowane podczas analizy. Cztery paczki mają potwierdzone CC0; [źródła i licencje](licenses/audio-sources.md). Nielicencjonowane lokalnie MP3 z `Laser` i utwór `ObservingTheStar` nie trafiają do gry.

Wdrożono 22 przygotowane efekty OGG: 19 zamienników dotychczasowych ról oraz ładowanie hipernapędu, wejście w skok i pętlę alarmu skażenia. Każdy rodzaj broni zachowuje osobne przypisanie, a trafienia skał są cichsze od trafień jednostek. Silnik, wydobycie i naprawa korzystają z osobnych pętli.

Nowy zestaw zajmuje **240 162 bajty**. Wycofano 18 dawnych OGG i cztery nieużywane WAV z folderu assetów, dzięki czemu preload nie ładuje równolegle obu zestawów. Oryginalne paczki użytkownika pozostają bez zmian. [Pełne mapowanie](audio-credits.md).

## Przygotowanie assetów

Skrypt `scripts/prepare-audio.mjs` i receptura `scripts/audio-assets.json` odtwarzają kopie z oryginałów. Skrypt wymaga FFmpeg, ale zwykły build korzysta z gotowych plików i nie wymaga dodatkowych narzędzi. Wyniki po zakodowaniu, rozmiary i sumy SHA-256 obu wersji zapisuje [manifest](audio-assets.json).

Efekty są mono 48 kHz. Usunięto ciszę z początku krótkich nagrań, ograniczono ogony i dodano łagodne zakończenia. Poziom uwzględnia RMS i szczyt, z kontrolą po ponownym zdekodowaniu OGG. Pętle mają 40 ms przenikania końca z początkiem i krótką osłonę granicy przed artefaktami kompresji. Zmierzony skok między ostatnią a pierwszą próbką każdej pętli pozostaje poniżej 0,03.

## Miks podczas gry

Zwykłe efekty mogą zająć do 14 głosów w grupie rozgrywki; cały limit wynosi 18. Pozostałe miejsca są przeznaczone na ważne sygnały. Przy pełnym limicie ważny dźwięk może zastąpić starszy zwykły efekt jednorazowy. Nie przerywa w ten sposób działającej pętli. Interfejs ma osobny limit 6/8. Nadal obowiązują ograniczenia liczby głosów każdego efektu, odstępy między zdarzeniami i tłumienie z odległością.

Bliska walka przycisza maszyny do 65% na 0,25 s od ostatniego zdarzenia. Skażenie przycisza je do 40% i uruchamia jedną pętlę alarmu. Wyjście z pasma kończy alarm. Pauza, wyciszenie, wybór prototypu i koniec wyprawy zatrzymują pętle.

Hipernapęd otrzymuje sygnały przy zmianie fazy, nie co klatkę. Anulowanie lub zakończenie ładowania zatrzymuje jego dźwięk. Ponowne włączenie dźwięku w połowie skoku nie odtwarza spóźnionego sygnału wejścia. Zatrzymanie sprawdza aktualność uchwytu, aby zakończona próbka nie zatrzymała późniejszego dźwięku używającego tej samej instancji z puli.

## Weryfikacja

**514/514 testów**, typecheck, lint i build przechodzą. Sześć nowych testów sprawdza zgodność receptury z plikami i manifestem, sumy kontrolne, poziomy, granice pętli i budżet assetów; rezerwację i zastępowanie głosów; cykl alarmu; fazy i anulowanie hipernapędu; wyciszenie podczas skoku oraz przyciszanie maszyn podczas walki. Pozostałe testy obejmują dotychczasowe wyciszenie, pauzę, pętle, ograniczenia zdarzeń i odległości.

Przygotowano również 20-sekundowy montaż nowych efektów z poziomami przypisanymi rolom, bez przesterowanych próbek. Jest próbką do odsłuchu, nie nagraniem całej rozgrywki ani dowodem subiektywnego balansu.

W izolowanej próbie przeglądarkowej z produkcyjnymi `SoundManager` i `MissionAudio` załadowano 22/22 OGG, uruchomiono maszyny, walkę, alarm i fazy hipernapędu. Końcowy miks osiągnął 13/18 głosów i zwolnił wszystkie po zakończeniu. Sprawdzono pauzę, wyciszenie i wznowienie. Końcowa konsola bez błędów i ostrzeżeń. Próba używa osobnego klucza ustawień i nie zapisuje kampanii; nie jest pełnym przejściem gry. Panel QA nie trafia do końcowego buildu.

## Dalej

Animacje dokowania i wylotu, powiązane z rzeczywistymi przejściami między lotem a stacją. W dźwiękach pozostaje odsłuch i strojenie balansu podczas dłuższej gry; nie dodano muzyki ani nagranych kwestii dialogowych.
