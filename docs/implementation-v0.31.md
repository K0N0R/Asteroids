# Orbit 0.31 - Feniks

Feniks (`phoenix`) domyka sześć konceptów floty. Uniwersalny szturmowiec łączy średnią ochronę i ładownię z bojowym wydobyciem oraz rakietą Atlasa. Ostre cofnięte skrzydła, jasne metaliczne panele, pomarańczowy rdzeń i szklany kokpit odtwarzają kierunek referencji użytkownika w figurach Pixi.

## Kadłub i wyposażenie

- Kadłub 95 HP; tarcza 55, regeneracja 8/s po 4,5 s bez obrażeń.
- Ładownia 55; dwa krótkie chwytaki o zasięgu 140.
- Prędkość 540; skręt 1,95; ciąg 1100; hamowanie 820; boost ×1,7.
- Jeden centralny projektor na dziobie `(42, 0)`; dwa silniki. Bez zwykłych działek i kamuflażu.
- Cena 190 rudy / 18 komponentów; warsztat II. Limit posiadanej floty nadal wynosi sześć, stocznia ma jedenaście typów.

## LPM - czerwony laser bojowy

Przytrzymany LPM tworzy jedną wiązkę o bazowym zasięgu 700. Zatrzymuje ją pierwsza skała, ściana lub przeciwnik. Nie przenika osłon ani nie zadaje obrażeń sojusznikom.

Bezpośrednie obrażenia wynoszą 30 HP/s. Trafiony przeciwnik płonie przez 3 s, otrzymując 8 HP/s także po puszczeniu LPM. Kolejne trafienia odnawiają czas, nie kumulują siły ani liczby efektów. Podpalenie ma pomarańczowe płomienie; wiązka jest czerwona. Nie przerywa co klatkę ładowania broni wroga.

Skały otrzymują 110 HP/s z dotychczasowymi premiami wydobycia. Rozpad, łup i fizyczne zbieranie przez chwytaki korzystają ze standardowych mechanizmów. Podpalenie dotyczy tylko przeciwników. Zniszczenie przez dotę zalicza przeciwnika, łup lub wrak dokładnie raz. Efekt jest usuwany po wygaśnięciu, śmierci celu i zwolnieniu misji; pauza i wybór prototypu zatrzymują symulację oraz zegary.

## PPM - rakieta

Feniks używa tej samej rakiety co Atlas: 160 obrażeń, promień eksplozji 180, prędkość 240, czas lotu 12 s, cykl 1,8 s. Trzymanie kursora na przeciwniku przez 3 s blokuje cel. Lock pozostaje po przesunięciu kursora, śmierć celu go usuwa i przerywa naprowadzanie wystrzelonych rakiet.

Bez locka rakieta leci w kierunku kursora. Przy locku skręca ku wybranemu wrogowi. Istniejące kolizje, blokowanie eksplozji osłonami i brak friendly fire pozostają. PPM nie uruchamia lasera ani granatów. Można jednocześnie trzymać oba przyciski.

## Ulepszenia i zapis

Projektor bojowy (`drill`) wzmacnia wiązkę, podpalenie i wydobycie o 25% na poziom. Układ rakietowy (`handling`) wzmacnia rakiety o 25%, skręt rakiet i manewry o 20% na poziom. Prototyp lasera zwiększa moc wiązki, podpalenia i wydobycia oraz jej zasięg. Pozostałe moduły zachowują standardowe działanie.

Format kampanii pozostaje 15. Kadłub, moduły, zakup, odzysk i złomowanie korzystają z istniejących mechanizmów. Uzbrojenie jest stałe; montaż zwykłych działek jest zablokowany. Chwilowe podpalenia nie są dopisywane do zapisu kampanii.

## Korekta ekonomii i panelu stacji

Ulepszenia wszystkich statków zużywają więcej komponentów i mniej rudy, aby ograniczyć blokowanie magazynu nadmiarem komponentów. Bazowe ceny pierwszego poziomu:

| Moduł                                   | Ruda | Komponenty |
| --------------------------------------- | ---: | ---------: |
| Silnik impulsowy                        |   12 |          8 |
| Dysze manewrowe / moduł specjalistyczny |   10 |          6 |
| Ładownia                                |    8 |          6 |
| Laser / projektor / moduł uzbrojenia    |   12 |         10 |
| Wzmocnienie kadłuba                     |   10 |          8 |
| Tarcza kinetyczna                       |   14 |         10 |

Poziomy II i III nadal kosztują odpowiednio dwu- i trzykrotność ceny bazowej oraz dotychczasową liczbę kryształów. Ceny statków, broni, warsztatu i magazynu nie zmieniają się. Wycena złomowania korzysta z nowych cen modułów; format zapisu i posiadane ulepszenia pozostają bez zmian.

Paski poziomów na kafelkach warsztatu i magazynu mają szerokość 177 przy szerokości kafelka 225, z marginesami po 24. Szeroki pasek w panelu szczegółów pozostaje bez zmian.

## Weryfikacja

Testy istniejących zestawów obejmują zakup i zapis, układ wyposażenia, model Pixi, obrażenia wiązki i doty, odnawianie bez kumulacji, wygaśnięcie i śmierć celu, przeszkody i wydobycie, dwa chwytaki, namierzanie i naprowadzanie rakiet, zachowanie ulepszeń oraz zatrzymanie efektów po zakończeniu misji. Regresje Atlasa sprawdzają współdzielony kod rakiet.

Bramki: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Oględziny w przeglądarce odbywają się na osobnym adresie, bez odświeżania aktywnych wypraw użytkownika.
