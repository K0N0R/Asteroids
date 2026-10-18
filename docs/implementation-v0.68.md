# 0.68: Harpun na Merkurym, przemysł kinetyczny i rozbudowa Satuk 15

Stan: 2026-10-17.

## Połączony zakres

Pakiet obejmuje wydobycie specjalistyczne, unikalne zadanie sektorowe, nowe zasoby i receptury, dwa poziomy tarczy oraz dwa dodatkowe segmenty magazynu. To jedna pętla zastosowania surowca; nie są to wyłącznie odblokowania w menu.

Po oddaniu zwiadu Merkurego cel **6** prowadzi na osobną odnogę przy (1750, 1350). Znajduje się tam sześć małych zakotwiczonych gniazd spieku merkuriańskiego oraz duża nieruchoma skała osłaniająca przed Słońcem. Trasa nie przecina dotychczasowych punktów schronienia i patroli. Główne zadania aktu IV pozostają wykonalne bez przemysłu kinetycznego.

Każde gniazdo ma 180 wytrzymałości i daje 3 jednostki spieku. Nie rozpada się na zwykłe odłamki ani żelazo. Harpun — odblokowany wcześniej przez przygotowanie osłony na Wenus — wysuwa ramiona PPM i zaciska szczęki osobnymi naciśnięciami LPM. Zwykłe pociski, energia, lasery, granaty, rakiety i ostrza Widma nie uszkadzają spieku. Nieskuteczny ostrzał wyświetla instrukcję użycia Harpuna. Odporność znajduje się we wspólnej ścieżce zadawania obrażeń skałom; broń nadal trafia w fizyczną przeszkodę.

Materiał zbierają zwykłe chwytaki; zajmuje ładownię, jest widoczny w HUD i trafia do magazynu po bezpiecznym powrocie. Strata statku nie dostarcza surowca. Kolejne wyprawy odnawiają złoża jak pozostałe zasoby sektora. Nie ma skończonej puli mogącej zablokować rozbudowę po nieudanej próbie.

## Produkcja i montaż

| Etap | Wejście | Wyjście / efekt |
| --- | --- | --- |
| Płyty kinetyczne | 4 spieku + 2 komponenty | 2 PK, 60 s |
| Moduł osłonowy | 2 PK + 4 komponenty + 2 moduły zasilania | 1 MO, 90 s |
| Tarcza I | 1 MO + 20 Fe + 4 komponenty | Obszar ochrony 1000 m |
| Tarcza II | 2 MO + 30 Fe + 6 komponentów | Obszar ochrony 1150 m |
| Wzmocniony segment magazynu | 2 PK + 1 segment magazynowy + 30 Fe + 4 komponenty | +400 miejsca; najwyżej dwa segmenty |

Produkcja wymaga warsztatu II, zwiadu Merkurego i mechanika w stacji. Korzysta z istniejącej kolejki i czasu aktywnej wyprawy. Koszt pobierany przy zleceniu, rezerwacja miejsca pozwala zarówno oddać materiały po anulowaniu, jak i zachować gotowy produkt. Nie dodano produkcji w lobby ani przy zamkniętej grze.

Montaż odbywa się po powrocie, z rzeczywistych zasobów magazynu. Niedostatek składników, brak mechanika lub warsztatu oraz osiągnięcie limitu nie pobierają częściowego kosztu. Tarcza wymaga wcześniej zamontowanego generatora; oba poziomy korzystają z tego samego rzeczywistego promienia dla fizyki, AI, pocisków, grafiki i radaru. Drony zachowują własną granicę patrolu; tarcza nie zaczyna chronić odległych placówek ani powierzchni planet.

Nowe magazyny dają łącznie +800 miejsca ponad wcześniejsze moduły. Maksimum przy wszystkich dotychczasowych rozbudowach rośnie z 1050 do 1850. Nie wymagają montażu trzech zwykłych segmentów najpierw; można rozwijać oba typy niezależnie.

Nowe opcjonalne zadanie **Osłona kinetyczna Satuk 15** opisuje trasę: Harpun → wydobycie → powrót → produkcja → montaż. Kończy się po pierwszym poziomie tarczy i wypłaca 20 Fe oraz 4 komponenty raz. Drugi poziom pozostaje dobrowolną inwestycją. Zadanie nie wymaga dodatkowego ręcznego oddawania spieku; koszt materiału wynika z produkcji i montażu.

## Interfejs i zapis

Stacja → Przemysł ma osobny widok **Przemysł kinetyczny**, ze stanami materiałów, kosztami receptur, czasami, wspólną kolejką i montażem wzmocnionego magazynu. Podstawowe receptury pozostają na pierwszym widoku. Ochrona Satuk 15 pokazuje poziom tarczy, koszt następnego poziomu, rzeczywisty promień i dodatkowe pierścienie osłony. Nowe gniazda mają własny kształt i jasny rdzeń; ich grafika nie zmienia współdzielonych kontekstów zwykłych skał.

**Nowy format kampanii 42 i dziennika 20.** Nowe poziomy stacji są wymaganymi polami zapisu; parser sprawdza zakres 0–2 i nie dopuszcza rozbudowanej tarczy bez generatora. Nowe surowce, produkcja w toku i opcjonalne zadanie są zapisywane. Stare formaty są odrzucane, bez migracji, zgodnie z decyzją autora. Aktywna wyprawa nadal nie jest wznawiana po odświeżeniu.

## Weryfikacja

**460/460 testów**, bez pominięć. Siedem nowych scenariuszy obejmuje złoża i odblokowania, odporność przy rzeczywistym ostrzale, lot bazowym Harpunem od stacji przez wydobycie i chwytaki do dokowania, łańcuch produkcji, zwroty i rezerwacje miejsca, atomowe montaże, zapis, stratę surowca oraz pocisk zatrzymany przez powiększoną tarczę. Pełny cykl produkcji jest sprawdzony przez kolejkę i upływ czasu aktywnej wyprawy; nie jest udawany przez podmianę gotowych modułów. Zachowano istniejący test zwykłego Prospectora przechodzącego główne misje Merkurego.

Przeglądarka przy 1280×720: sprawdzono oba widoki przemysłu, kolejkę obu nowych receptur, pobranie kosztów magazynu i wzrost pojemności 250 → 650, tarczę 850 → 1000 → 1150 m oraz automatyczne zamknięcie zadania po poziomie I. Ręcznie wyrwano Harpunem gniazdo: obiekt zniknął, a chwytaki zebrały **3 Sp** widoczne w HUD. Użyto osobnego klucza QA, przygotowanych zapasów dla kontroli menu i przygotowanego położenia przy złożu dla kontroli grafiki; zwykły dolot i produkcja są pokryte osobnym testem symulacji. Podgląd nie mierzy końcowego balansu ekonomii.

Typy, lint, build wydania oraz kontrola różnic sprawdzane przed zakończeniem. Jedna uwaga renderera dotycząca dziecka dodanego do Graphics została usunięta przez niezależny kontekst rysowania gniazd. Końcowa kontrola przeglądarki dotyczy tej poprawki. Zdjęcia w `dist/qa068-industry.jpg`, `dist/qa068-shield.jpg` i `dist/qa068-harpoon.jpg`.

Dalszy zakres pozostaje otwarty: większe obszary i nawigacja, animacja śmierci przed śmiertelnym hipernapędem, raportowanie przez łączność, transfer ładunku i towarzysz w pierwszym sektorze. Hipernapęd, paliwo i anomalie jako teren nie zostały wdrożone w tym pakiecie. Ciągłe przejście całej nowej kampanii i końcowy balans wymagają dalszych testów graczy.
