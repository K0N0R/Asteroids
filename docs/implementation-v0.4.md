# Prototyp 0.4 — ratunek i odzysk

## Pętla gry

Po stracie statku pilot i kadłub z modułami mogą przetrwać jako sygnał ratunkowy. Łup i zestawy na utraconym statku przepadają. Baza, flota rezerwowa, załoga stacji i jej produkcja nadal pozostają. Szanse pilota i statku są osobnymi losowaniami: dostępna może być kapsuła, wrak, obydwa lub nic.

Zakładka Ratunek pokazuje do trzech sygnałów wraz z zawartością i odległością od Aurory. Wybór celu zmienia start na akcję ratunkową. Przycisk Nowy sektor wraca do zwykłej wyprawy. Można przygotować nowego pilota i statek lub skorzystać z programu awaryjnego przy braku środków.

Akcja ratunkowa odtwarza początkowy układ sektora z seeda utraconej wyprawy. Cel ma własną kapsułę i sylwetkę odpowiedniego kadłuba, pierścień podejścia oraz znacznik na minimapie. Nawigacja od razu wskazuje cel; klawisz 6 pozwala do niego wrócić.

Podjęcie wymaga przytrzymania E przez 4 s w odległości poniżej 160, przy prędkości nie większej niż 80, bez ciągu, strzelania, naprawy i świeżych uszkodzeń. Przerwanie warunków zeruje postęp. Pierścień pokazuje postęp operacji. Pilot i wrak trafiają na hol; HUD automatycznie wskazuje bazę. Odzysk jest rozliczany dopiero po dokowaniu.

Pilot wraca z tym samym identyfikatorem i cechą, a statek do rezerwy z tym samym identyfikatorem i modułami. Obecny pilot i statek pozostają aktywni. Jeśli hangar jest pełny, odzyskany kadłub rozbieramy na połowę ceny kadłuba i modułów, jak przy złomowaniu. Materiały mają wspólne rozliczenie z kontraktem i łupem; magazyn przyjmuje komponenty w pierwszej kolejności i raportuje nadwyżkę.

## Ryzyko i balans

Porażka akcji ratunkowej traci jej dotychczasowy cel, nawet jeżeli był już podjęty. Dotyczy to również odświeżenia. Nowo utracony statek i pilot podlegają zwykłemu losowaniu przetrwania. Powrót bez podjęcia celu pozostawia sygnał na później. Przy czwartym sygnale wygasa najstarszy. Nie stosujemy timera offline.

Losowanie zależy deterministycznie od seeda wyprawy i identyfikatorów pilota/statku. Samo odświeżenie nie zmienia wyniku przetrwania. Definicje i wzory są w `config.ts` oraz `state/recovery.ts`:

| Wpływ | Szansa kapsuły | Szansa wraku |
| --- | --- | --- |
| Podstawa | 20% | 35% |
| Prospector / Swift / Mule | +10 / +18 / +22 p.p. | +10 / +18 / +22 p.p. |
| Mira / Ivo / Nela / Kadet | +12 / +8 / +20 / 0 p.p. | — |
| Poziom pancerza | +4 p.p. | +8 p.p. |
| Górny limit | 85% | 80% |

W bazie pokazujemy efektywne szanse dla aktywnego zestawu. Piloci w kapsułach rezerwują miejsca w limicie 8; zatrudnienie nie blokuje późniejszego ratunku. Licznik utraconych pilotów rośnie dopiero przy trwałej stracie, wygaśnięciu sygnału lub porażce ratunku.

## Zapis i ograniczenia

Format kampanii 4 zachowuje ten sam klucz localStorage. Migracja wersji 1–3 zachowuje istniejącą kampanię, flotę, moduły, pilotów i załogę. Nie tworzy wraków po historycznych stratach. Aktywny znacznik zapisuje cel ratunku i ostatnią pozycję, aktualizowaną co 5 s symulacji. Wczytanie aktywnej wyprawy nadal oznacza przegraną.

Walidacja sprawdza zawartość sygnałów, współrzędne, modele, wyposażenie, unikalność identyfikatorów między bazą i sygnałami oraz zgodność celu i seeda aktywnej akcji. Rozliczenie wyprawy jest jednokrotne. Zdobycie holu nie dopisuje niczego do bazy przed bezpiecznym powrotem.

Sektor odtwarzamy w stanie początkowym; nie zapisujemy rozbitych asteroid ani ich późniejszych pozycji. Początek podejścia do sygnału ma miejsce na manewr; ruchome skały mogą potem wejść w jego strefę. Sygnały po stratach w dokach lub poza granicą sektora przesuwamy do osiągalnego promienia 650–5100. Hol jest wizualnym transportem bez osobnej fizyki ani wpływu na lot i nie zajmuje ładowni. Odzyskany statek jest przygotowywany w bazie, zgodnie z dotychczasową zasadą startu z pełnym kadłubem. To parametry prototypu do dalszego ogrania.

## Weryfikacja

Przeszły sprawdzanie typów, lint, build produkcyjny oraz wszystkie 42 testy.

42 testy obejmują dotychczasowy lot i gospodarkę oraz przetrwanie, utratę łupu, odzysk identyfikatorów i modułów, pełną ładownię, pełny hangar i magazyn, przerwany ratunek, limity pilotów/sygnałów, migrację i nieprawidłowe zapisy. Test symulacji przechodzi podjęcie, przerwanie postępu i dokowanie; podwójne rozliczenie oraz roszczenie celu spoza akcji są odrzucane.

W przeglądarce na odrębnym porcie 3001 sprawdzono pełną akcję: wybór celu, lot, podjęcie Miry i Prospectora z silnikiem I/pancerzem I, hol, dokowanie, ponowne wczytanie, powrót pilota do załogi i kadłuba do rezerwy oraz zachowanie obu modułów. Sprawdzono też ekran straty po wczytaniu aktywnej wyprawy. Konsola nie zgłosiła błędów ani ostrzeżeń.

Zrzuty: [wybór celu](screenshots/recovery-lobby-v0.4.jpg), [cel na holu](screenshots/recovery-tow-v0.4.jpg), [udany odzysk](screenshots/recovery-result-v0.4.jpg), [przywrócone moduły](screenshots/recovered-ship-v0.4.jpg).
