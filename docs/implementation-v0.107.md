# 0.107 — reżyseria lotu i oprawa misji

## Wdrożony zakres

Wylot kampanii ma 1,8 s sekwencji wyjścia z centralnej części Satuk 15. Widok statku rośnie i oddala się od stacji, silnik pracuje, kamera wraca do kadru pilota. Symulacja czeka podczas wylotu; sterowanie i HUD wracają po zakończeniu. Sandbox pomija tę sekwencję.

Po rzeczywistym spełnieniu warunków dokowania symulacja oznacza powrót według dotychczasowych zasad. Widok przedstawia 1,5 s podejścia do stacji przed rozliczeniem wyprawy przez sesję. Prezentacja nie wykonuje ponownego przekazania ładunku, nie zalicza zadań i nie zmienia fizyki. Utrata fokusu i otwarte okna zatrzymują ją razem z widokiem gry. Nie zmieniono formatów kampanii 66 ani dziennika 29.

Przy pobliskich przekaźnikach, archiwach i stoczni polowej pojawiają się krótkie komentarze z portretem. Potwierdzony odczyt ma osobną reakcję. Przy spokojnym locie kamera może przesunąć kadr do 28% odległości w stronę obiektu przez 2,6 s. Odległość wyzwalania wynosi do 650 jednostek; nie ma dalekich przeskoków poza statek. Manewr, ostrzał, wysoka prędkość, minigra, transfer lub hipernapęd przerywa ujęcie. Pobliska żywa jednostka przeciwnika oddaje kamerę pilotowi i może wywołać ostrzeżenie.

Niemodalne komunikaty dotyczą też temperatury od 75% oraz kadłuba poniżej 30%. Ostrzeżenie krytycznego kadłuba ma pierwszeństwo. Kategorie ostrzeżeń i konkretne odkrycia nie powtarzają się w tej samej wyprawie. Tekst jest odsłaniany stopniowo; świat i sterowanie pozostają aktywne. Dotychczasowe rozmowy zatwierdzające postęp zachowują swój osobny mechanizm.

Oprawa korzysta z kodowych ilustracji wektorowych:

- sześć ról przeciwników: odrębne sylwetki, panele pancerza, wielolufowy Pancernik, wyposażenie naprawcze Serwisanta i zasobniki stawiacza min;
- sonda księżycowa z anteną i podporami odróżniona od orbitalnego przekaźnika;
- archiwum z zasobnikami danych i radiatorem;
- pokłady i radiatory chronionej instalacji, zachowany odsunięty terminal;
- wyraźna hala i rdzeń stoczni polowej;
- osobny krótki impuls trafienia osłony oraz warstwowy wybuch;
- ciemniejsze wnętrza lokalnych kraterów, centralne wzniesienia i dyskretne światła podejścia do księżycowej placówki.

Nowe efekty podlegają istniejącemu limitowi 800 cząstek i usuwaniu po zakończeniu życia. Teren jest rysowany przy budowie widoku. Komunikaty i kamera nie tworzą trwałych pól zapisu ani timerów działających poza sesją.

## Weryfikacja

Sześć nowych testów reżyserii obejmuje czas wylotu i dokowania, opcjonalne pominięcie wylotu, priorytety ostrzeżeń, brak powtórzeń, oddanie kamery, stratę statku i duże odstępy klatek. Test integracyjny korzysta z Rapiera, MissionSimulation i MissionWorld: sprawdza zatrzymanie fizyki w czasie wylotu, rzeczywistą interakcję dokowania, oczekiwanie na zakończenie animacji i pozostawienie rozliczenia sesji. Siedem istniejących testów rozkazów misji sprawdza blokady dokowania, raportowanie i odwrót.

Dodatkowo uruchomiono pięć testów open-world: cztery przechodzą. Test „lunar rescue coexists with construction escort…” nadal oczekuje usuniętego księżycowego ratunku i nie przechodzi także na niezmienionym HEAD sprzed tego pakietu. Nie zmieniano tego starszego scenariusza ani mechanik ratunku w ramach reżyserii.

Podgląd przeglądarkowy w osobnej kampanii testowej objął klatki wylotu i dokowania, zakończenie sekwencji powrotu, komunikaty odkrycia i uszkodzenia, planszę sześciu przeciwników i instalacji oraz teren z działającą placówką Księżyca. Nie odświeżano zapisu gracza. Typecheck, lint zmienionych plików i build release służą końcowej kontroli kompilacji.

## Co pozostaje w tych punktach planu

To pakiet prezentacyjny, bez nowych rozstrzygnięć fabularnych. Nie dodaje powierzchni Marsa, Wenus ani Merkurego: ich grywalne instancje trzeba zaprojektować razem z zadaniami. Pozostają sceny kluczowych odkryć i ataków, dialogi właściwe aktom II–X, dalsze instalacje i indywidualna oprawa bossów. Następny rekomendowany pakiet to reżyserowany początek pościgu po Księżycu i oprawa marsjańskiej stoczni w kontekście zrefaktorowanego aktu II.
