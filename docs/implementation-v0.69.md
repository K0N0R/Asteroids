# Wersja 0.69 — nawigacja i utrata statku

Data: 2026-10-18. Pakiet obejmuje większy obszar Ziemi, hipernapęd, paliwo, śluzy oraz animację zniszczenia. Format kampanii **43**, dziennika **20**. Poprzednie formaty są odrzucane, bez migracji.

## Sterowanie i paliwo

- Po uruchomieniu ziemskiego zaplecza dostępna jest spacja: ładowanie 0,7 s, potem przelot do 4000 m z prędkością 4000 m/s. Ponowna spacja przerywa ładowanie bez zużycia ogniwa. Trzymanie klawisza nie ponawia skoku.
- Poza śluzą kierunek wskazuje kursor; zasięg skraca granica sektora. W śluzie cel jest drugim końcem trasy. K wskazuje najbliższy punkt śluzy, także na radarze.
- Każdy statek ma własny zbiornik 0–3, nowy statek zaczyna z 3 ogniwami. Jedno ogniwo zużywa rozpoczęcie przelotu, nie ładowanie. Zużycie jest od razu zapisywane.
- Stacja → Przemysł → Paliwo: ręczne tankowanie aktywnego statku z magazynu, również częściowe. Receptura: 6 Fe + 1 komponent, 45 s pracy mechanika → 3 ogniwa. Produkcja działa podczas lotu; zwykły napęd i Shift nie zużywają paliwa.
- Skok wymaga niskiej prędkości, sprawnych silników i braku niedawnego trafienia. Jest niedostępny na powierzchni, podczas holowania, pracy chwytaków, transferu, minigier, obrony bazy i starcia z bossem. Trafienie przerywa działanie; zużyte ogniwo nie wraca.

## Pierwszy sektor z odległymi obszarami

Po warsztacie I promień ziemskiego obszaru rośnie do 5500 m. Trzy oznaczone obszary: bliska orbita Satuk 15, węzeł łączności i zewnętrzne złoża. Dodano odległe bogate skały Fe/Cu oraz dwie dwukierunkowe trasy, w tym przelot 3600 m do zewnętrznych złóż. Dotychczasowe cele pozostają dostępne.

Śluzy mają promień 110 m. Statyczne skały usunięto z korytarzy; kontrola fizycznej przejezdności działa przed ładowaniem i ponownie przed wydaniem paliwa. Zablokowana trasa odmawia startu. Późniejsze wtargnięcie obiektu nadal jest zagrożeniem — śluza nie daje niezniszczalności.

## Kolizja i prezentacja straty

Każdy odcinek rzeczywiście przebytej drogi jest sprawdzany przez swept shape w Rapierze, z promieniem obejmującym kadłub. Mała przeszkoda pomiędzy klatkami nie może zostać pominięta. Kolizja podczas przelotu niszczy statek nawet z pełną tarczą.

Symulacja natychmiast kończy wyprawę, blokując sterowanie, cele i dalsze zbieranie. Warstwa prezentacji pokazuje przez 1,8 s eksplozję, rozpad, wygaszenie i napis „SYGNAŁ UTRACONY”. Następnie następuje dotychczasowe jednorazowe rozliczenie straty. Dotyczy również zwykłych zniszczeń i raportu sandboxa. Pauza zatrzymuje animację.

## Weryfikacja

- **468/468 testów**. Osiem nowych prób obejmuje rzeczywisty dolot Prospectora do śluzy, skok i powrót, paliwo i produkcję, blokady, anulowanie, całodrogowe wykrycie cienkiej przeszkody, ochronę przed startem w zablokowanym korytarzu i kontrolę aktualnego formatu zapisu.
- Typecheck, lint, build i kontrola białych znaków wykonane przed oddaniem pakietu.
- Ręcznie w przeglądarce: tankowanie 1→3 przy stanie magazynu 3→1, rzeczywisty przelot śluzą i powrót, HUD i smugi, kolizja ze skałą z pełną tarczą, animacja utraty oraz późniejszy ekran porażki. Bez błędów i ostrzeżeń konsoli w obu scenariuszach.
- Testy UI korzystały z przygotowanych lokalnych kampanii i pozycji startowych. Nie oznacza to ciągłego przejścia dziesięciu aktów od nowego zapisu ani zakończenia balansu ekonomii.

## Dalej

Pozostałe sektory nie otrzymały jeszcze większych układów i własnych śluz. Nieregularne skupiska, dryf asteroid i alternatywne trasy są kolejnym rozwinięciem nawigacji. Osobny większy pakiet powinien połączyć raporty przez łączność i transfer ładunku bez dokowania; dopiero do tego cyklu dołączymy prowadzącego Prospectora AI. Nowe dźwięki z paczek, anomalie oraz animacje dokowania i wylotu nadal pozostają w backlogu.
