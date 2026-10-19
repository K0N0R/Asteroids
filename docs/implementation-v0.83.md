# 0.83 — budowa kadłubów z części

## Zakres

Stocznia buduje kadłuby z sześciu rodzin części: poszycia stalowego I, elektroniki I, maszynerii I, podtrzymywania życia I, zespołów napędowych I i układów zasilania I. Każdy model ma własny manifest. Usunięto dawne ceny kadłubów w żelazie i ogólnych częściach z konfiguracji statków; źródłem kosztu jest `state/fleetConstruction.ts`.

Cały manifest jest sprawdzany przed zmianą magazynu. Brak choć jednej części nie zużywa pozostałych, nie przenosi aktywnego statku do rezerwy i nie zwiększa identyfikatora floty. Nadal obowiązują odblokowania fabularne, poziom zaplecza, limit sześciu jednostek i zakaz budowy podczas lotu.

Podstawowy napęd oraz układ zasilania można wytworzyć już w początkowym warsztacie. Nowa kampania pozwala przejść ręcznie przez pełny łańcuch pierwiastki → materiały → części → Prospector bez rozbudowy urządzenia wymagającego tych samych części. Hipernapęd pozostaje osobnym ulepszeniem statku i nie jest montowany w nowym kadłubie automatycznie.

## Hangar

Stocznia ma zakładki Parametry, Budowa i Ulepszenia w dotychczasowym panelu. Budowa pokazuje sześć rodzajów części, ilustracje oraz liczbę skompletowanych sztuk. Braki wyróżnia kolor, a przycisk budowy działa dopiero z pełnym kompletem. Zakup nie korzysta już z dawnych liczników Fe/poszycia. Zakładki bazy i ich układ pozostają zachowane.

## Odzysk i możliwość dalszej gry

Zezłomowanie jednostki z rezerwy zwraca połowę, po zaokrągleniu w dół dla każdej pozycji, jej manifestu części i kosztów zamontowanych ulepszeń oraz uzbrojenia. Uwzględnia również poziomy hipernapędu. Nie dodaje żelaza za sam bazowy kadłub. Dialog pokazuje pełną listę odzysku.

Odzysk własnego wraku przy pełnym hangarze rozlicza wszystkie zwracane rodziny części, zarówno przy dostawie w trakcie lotu, jak i końcowym rozliczeniu wyprawy. Nie traci elektroniki, maszynerii ani systemów statku przez stare rozliczanie tylko Fe/poszycia/Si. Dostawa nadal jest jednorazowa i zapisywana.

Zestaw awaryjny ocenia posiadanie kompletu części, a nie sam zapas żelaza. Po utracie ostatniego statku duży magazyn pierwiastków nie blokuje awaryjnego Prospectora. Najpierw wykorzystuje jednostkę z rezerwy; nie przyznaje darmowego kadłuba, gdy gracz ma komplet do jego budowy. Częściowa pomoc (sam pilot albo sam kadłub) jest raportowana jako zmiana do zapisania.

## Dalszy zakres

Ta paczka obejmuje manifesty kadłubów poziomu I. Warianty materiałowe oraz części II–III, przebudowa kosztów zwykłych modułów i uzbrojenia, urządzenia stacji, wszystkie manifesty aktów i łup wrogich wraków pozostają do osobnych etapów. Nie zmieniono parametrów kadłubów ani wymagań fabularnych.

Format kampanii: 51. Starsze zapisy są odrzucane zgodnie z ustaloną polityką; nie przeliczamy inwestycji starej gospodarki.

## Weryfikacja

- Pełna regresja: **548/548**, bez pominięć; log lokalny `dist/fleet-regression-full.log`.
- Dziewięć nowych testów: kompletność manifestów, atomowa budowa, brak zastępowania części pierwiastkami, rzeczywisty łańcuch ręcznej produkcji od początkowych urządzeń, blokady budowy, awaryjna pomoc, recykling z hipernapędem, odzysk własnego wraku przy pełnym hangarze i odrzucenie poprzedniej gospodarki.
- Dotychczasowe testy floty, fizyki, ratunku i kampanii korzystają z jawnego zaopatrzenia w części; zachowują sprawdzanie cen, blokad, tożsamości i wyposażenia statków. Test stabilizacji nadal sprawdza, że recykling nie tworzy materiałów ponad inwestycję.
- Typecheck, lint i build: OK.
- Izolowany podgląd przeglądarkowy bez zapisu kampanii: lista części z brakami (4/6), komplet (6/6), aktywacja przycisku, zbudowanie Swifta, przeniesienie Prospectora do rezerwy oraz dialog złomowania z właściwym odzyskiem. Brak błędów konsoli i kolizji tekstów.
- Zrzut: `dist/qa-fleet-construction.jpg`. Tymczasowa strona QA nie wchodzi do wydania.
