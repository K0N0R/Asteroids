# Prototyp 0.3 — flota i kadłuby

## Zakres

Hangar ma widok modułów aktywnego statku oraz widok floty/stoczni. Można posiadać do trzech kadłubów. Każdy ma własny trwały identyfikator i zestaw ulepszeń. Zakup aktywuje nowy statek i zachowuje dotychczasowy w rezerwie; przełączanie nie przenosi modułów pomiędzy kadłubami.

| Kadłub | Kadłub / ładownia | Prędkość / przyspieszenie | Cena | Rola |
| --- | --- | --- | --- | --- |
| Prospector I | 100 / 40 | 480 / 1000 | 15 rudy | Obecny, niezmieniony punkt odniesienia |
| Swift | 85 / 35 | 620 / 1500 | 65 rudy + 4 komponenty | Szybszy i zwinniejszy zwiadowca |
| Mule | 150 / 80 | 400 / 850 | 85 rudy + 6 komponentów | Większy statek wydobywczy, działko +30% |

Swift i Mule wymagają warsztatu I. To pierwsze propozycje balansu, z różnymi zaletami, a nie finalne ceny i statystyki. Sterowanie bazowego Prospectora pozostało bez zmian. Wszystkie parametry kadłubów znajdują się w `frontend/game/config.ts`; późniejszy nerf statku początkowego nie wymaga zmiany kontrolera lotu.

Każdy model ma inną geometryczną sylwetkę i wielkość. Typ kadłuba wpływa na rzeczywistą fizykę, przyspieszenie, hamulec, obrót, prędkość, kadłub, ładownię, siłę wydobycia, rozmiar hitboxa i położenie wylotu pocisku. HUD oraz ekran wyniku pokazują używany model.

## Straty i złomowanie

Śmierć usuwa aktywnego pilota i statek z jego modułami. Statki rezerwowe, baza i załoga pozostają. Po stracie można wybrać zapasowy kadłub; program awaryjny wykorzystuje rezerwę przed przyznaniem nowego statku.

Rezerwowy statek można zezłomować po potwierdzeniu. Odzyskujemy połowę materiałów z ceny kadłuba i wszystkich poziomów jego modułów, zaokrągloną w dół. Dialog podaje konkretny statek, stratę modułów i zwrot. Aktywnego statku nie można złomować. Brak miejsca na zwrot w magazynie blokuje operację. Zakupy, wybór i złomowanie są zablokowane w trakcie misji.

## Zapis

Wewnętrzna wersja danych to 3, pod dotychczasowym kluczem localStorage. Migracja wersji 1 i 2 zachowuje kampanię, moduły obecnego Prospectora, pilotów, załogę, materiały i politykę aktywnej wyprawy. Nowy format zapisuje także rezerwę, identyfikatory i typy kadłubów; odczyt odrzuca duplikaty identyfikatorów, nieznane modele oraz zbyt dużą flotę.

## Weryfikacja

Wszystkie 32 testy, sprawdzanie typów, lint i build produkcyjny przeszły. Testy obejmują dotychczasowe systemy oraz zachowanie bazowego sterowania, rzeczywiste prędkości modeli, moc działka Mule, zachowanie modułów, zakupy i blokady, przełączanie, straty tylko aktywnego statku, program awaryjny z rezerwą, zwrot materiałów ze złomowania, pojemność magazynu i migrację zapisu.

W przeglądarce użyto odrębnej kampanii na porcie 3001. Sprawdzono zakup Swift i Mule, powrót do ulepszonego Prospectora, zachowanie floty po odświeżeniu w bazie, blokadę zakupów przy pełnym hangarze oraz dialog i anulowanie złomowania. Wyprawa Mule pokazała właściwy model, kadłub 150 i ładownię 80. Konsola nie zawierała błędów ani ostrzeżeń. Zrzuty: [hangar](screenshots/fleet-v0.3.jpg), [Mule podczas wyprawy](screenshots/mule-v0.3.jpg).

Kolejne rozszerzenia pozostają zgodne z priorytetem eksploracji: ratunek pilota/odzysk wraku, więcej miejsc i kontraktów, dalsza załoga. Walka i infiltracja mogą pojawić się później. Docelowy balans statku startowego wymaga dalszego ogrania.
