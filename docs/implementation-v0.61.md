# Implementacja 0.61 — Muł na budowie księżycowej

Zastępuje wcześniejszą opcjonalną eskortę przy Ziemi. Po zwiadzie trasy księżycowej Muł czeka przy budowie stacji na powierzchni. **N** wskazuje go (na orbicie wskazuje wejście na Księżyc), **E przez 2 s** rozpoczyna eskortę. Transport jest dostępny podczas zwykłego lotu i dostawy budowlanej; osobna misja ratunkowa nie tworzy drugiej eskorty.

## Wspólne dostawy

Główne Fundamenty stacji paliw wymagają **160 Fe**. Muł ma standardową pojemność **110** i **150 HP**. Wydobywa prawdziwe skały, zbiera pochodzącą z nich rudę, po załadunku wraca do placówki i fizycznie przekazuje ładunek. Następnie wraca do wydobycia. Nie przyznaje nagrody raportowej ani rudy do banku za samo zakończenie eskorty.

Gracz może jednocześnie wydobywać i dostarczać własne surowce przez **7 → budowa, E**. Obie jednostki korzystają z tego samego trwałego licznika; ostatnia dostawa zabiera tylko brakującą ilość. Nadwyżka pozostaje w ładowni dostawcy. Fundamenty odblokowują projekt grywalnego Muła, nadal wymagający zakupu i warsztatu. Wcześniejsze odblokowanie po ziemskim warsztacie usunięto.

Muł omija przeszkody, czeka na odległą eskortę, wstrzymuje wydobycie przy przeciwnikach i zmienia stanowisko po wyczerpaniu najbliższych skał. Nowe złoże ma przytwierdzone formacje i korytarze podejścia. Nie tworzy surowców, jeśli złoże się wyczerpie; gracz może kontynuować własne dostawy. Zasadzka występuje na powierzchni podczas dolotu do złoża.

## Naprawy i porażka

Muł zachowuje do **4 komponentów** na naprawy, pozostałe komponenty ze skał może zebrać gracz. Produkcja zestawu kosztuje dokładnie tyle, co u grywalnego Muła: **12 Fe + 2 komponenty z własnej ładowni**, przy zapasie zestawów równym zero. Bezpieczny postój i **5 s** pracy odnawiają **25 HP**, zużywając zestaw. Ostrzał przerywa postęp naprawy; brak materiałów uniemożliwia produkcję. Nie ma darmowej regeneracji.

Utrata Muła nie usuwa dostarczonej rudy ani nie blokuje budowy: można samodzielnie dokończyć dostawy lub wrócić po kolejny transport. Niedostarczony ładunek zniszczonego Muła przepada. Kolejny lot tworzy świeżego NPC, bez przenoszenia jego ładunku i zestawów. Na orbicie Muł nie prowadzi wydobycia, napraw ani podróży. Ukończenie fundamentów przez gracza nie wskrzesza zniszczonego transportu.

## Zapis i interfejs

Format kampanii **39**, dziennika **18**. Starsze formaty są odrzucane, bez migracji. Dostawy zapisują się na bieżąco poprzez istniejący mechanizm budowy; nie dodano wznawiania lotu.

HUD pokazuje stan, ładunek, dostarczoną rudę, HP i naprawę. Osobny wiersz zapobiega nakładaniu komunikatu eskorty na informacje placówki. Radar powierzchni pokazuje Muła i wrogów; opis budowy i jej licznik używają nowego celu.

## Weryfikacja

Pełna regresja: **416/416 testów**, bez pominięć. Po końcowym rozdzieleniu rozliczeń NPC i frachtu gracza ponownie przeszło **13/13 testów** eskorty i powierzchni. Typecheck, lint i produkcyjny build przechodzą.

- Pełna zwykła wyprawa bazowym Prospectorem: lot z Satuk 15, wejście na powierzchnię, uruchomienie eskorty, wydobycie przez AI, walka z zasadzką, co najmniej dwa kursy, fizyczne przekazanie 160 Fe, odblokowanie kadłuba i bezpieczny powrót. Bez teleportacji i dopisywania ładunku; przygotowany legalny postęp do zwiadu Księżyca.
- Osobne próby sprawdzają sumowanie dostaw gracza i AI, częściowy ostatni ładunek, brak potrącania frachtu gracza przez dostawę NPC, trwałość budowy, koszt/czas/przerwanie naprawy, brak darmowych zestawów oraz ponowienie po zniszczeniu transportu.
- Dotychczasowy test ręcznego transportu rozszerzony do pięciu rzeczywistych lotów. Nadal przechodzi zwykłe wydobycie i oddanie rudy przez gracza.
- Przeglądarka: przygotowana scena QA przy placówce, bez przeciwników, do sprawdzenia opisu, nawigacji, statusów i rozpoczęcia eskorty. To kontrola UI, pełny przebieg z walką potwierdza test symulacji. Tymczasowy bundle i strona QA są usuwane przez końcowy build.

Kontrola UI bez błędów konsoli. Dowody: [opis zadania](validation-v0.61/construction-order.png), [Muł na powierzchni](validation-v0.61/mule-at-construction.png).
