# Prototyp 0.6 — doświadczenie i umiejętności pilotów

## Progresja

Każdy pilot ma osobne PD i trzy umiejętności. Poziom oraz dostępne punkty są wyliczane z PD i wydanych punktów, zamiast zapisywania trzech niezależnych liczników. Zapasowi piloci nie zdobywają doświadczenia podczas cudzej wyprawy.

| Poziom pilota | Łączne PD | Łączne punkty rozwoju |
| --- | --- | --- |
| 1 | 0 | 0 |
| 2 | 20 | 1 |
| 3 | 50 | 2 |
| 4 | 90 | 3 |
| 5 | 140 | 4 |

PD przyznajemy raz przy udanym dokowaniu, faktycznie lecącemu pilotowi. Przegrana, odświeżenie, pusta wyprawa i samo spędzenie czasu nie dają PD. Częściowa wyprawa z łupem może dać doświadczenie bez premii kontraktu. Punkty odnoszą się do przywiezionego ładunku i wykonanej pracy, także gdy pełny magazyn odrzuci część materiałów.

| Zabezpieczona czynność | PD |
| --- | --- |
| Ładunek | 1 za rudę, 2 za komponent; maksymalnie 20 |
| Dane | 5 za każde różne miejsce badawcze |
| Wykonany kontrakt | 10 |
| Uratowany pilot | 15 |
| Odzyskany wrak | 5, także gdy pełny hangar zamieni go na materiały |
| Limit całej wyprawy | 50 |

PD pilota nie przekraczają 140. Wyprawa może przekroczyć więcej niż jeden próg i przyznać odpowiednią liczbę punktów. Ratownik zdobywa doświadczenie za odzysk; uratowany pilot wraca z takim rozwojem, jaki miał przed stratą. Wcześniejsze PD i umiejętności są zachowane w kapsule wraz z jego identyfikatorem.

## Wybór umiejętności

Zakładka Piloci ma listę i nabór oraz panel Rozwój aktywnego pilota. Kliknięcie pilota wybiera go i otwiera jego rozwój. Lista pokazuje poziomy, a znak (+) na zakładce przypomina o wolnych punktach w załodze. Panel pokazuje próg następnego awansu, pasek postępu, wolne punkty i trzy umiejętności.

| Umiejętność | Premia jednego poziomu | Maksimum |
| --- | --- | --- |
| Manewrowanie | Obrót i hamowanie +3% | +6% |
| Wydobycie | Obrażenia działka skałom +5% | +10% |
| Procedury ewakuacji | Szansa kapsuły +6 p.p. | +12 p.p. |

Każdy poziom umiejętności kosztuje jeden punkt; limit wynosi dwa poziomy. Łącznie dostępne są cztery punkty, więc pilot nie osiągnie maksimum wszystkich trzech umiejętności. Wybór jest trwały i bez kosztu surowców. Nie ma jeszcze resetowania umiejętności ani aktywnych zdolności. Rozwój jest blokowany w czasie wyprawy; przyciski są wyłączane przy braku punktu albo osiągnięciu limitu.

Bonus manewrowania mnoży bazową cechę pilota i wpływa również na automatyczne hamowanie. Wydobycie mnoży bonus kadłuba i modułu działka. Ewakuacja zwiększa tylko szansę kapsuły, z dotychczasowym limitem 85%; nie poprawia szansy wraku. Sam poziom nie zwiększa statystyk — liczy się wybór umiejętności. Początkujący pilot ma identyczny lot i wydobycie jak w v0.5, a maksymalna prędkość statku pozostaje bez zmian.

HUD pokazuje poziom pilota. Ekran powrotu podaje PD, awans i dostępne punkty. Baza przelicza szanse przetrwania po przydzieleniu umiejętności. Profil parametrów lotu jest obliczany na starcie wyprawy.

## Zapis i straty

Format kampanii 6 zachowuje dotychczasowy klucz localStorage. Migracja wersji 1–5 zachowuje pilotów, ich cechy, flotę, materiały, załogę, historię kontraktów i aktywne znaczniki. Piloci z wcześniejszego zapisu, także w kapsułach, zaczynają z 0 PD i pustymi umiejętnościami. Nie zgadujemy historycznego doświadczenia na podstawie liczby powrotów całej bazy.

Walidacja obejmuje PD 0–140, całkowite poziomy umiejętności 0–2, dokładnie znane umiejętności i wydanie nie większej liczby punktów niż wynikająca z poziomu. Zasady dotyczą również pilotów w sygnałach ratunkowych. Nowi zatrudnieni piloci i kadeci z programu awaryjnego zaczynają od początku. Trwała śmierć usuwa także rozwój pilota; przy udanym ratunku odzyskujemy go w całości.

## Weryfikacja

Przeszły wszystkie 62 testy, kontrola typów, lint i build produkcyjny. Nowe testy obejmują progi, przydział punktów, limity, brak PD za puste wyprawy, jednokrotne rozliczenie, doświadczenie tylko lecącego pilota, zachowanie kapsuły, migrację i błędne zapisy. Test symulacji Rapier mierzy lepszy obrót i hamowanie, rzeczywistą premię obrażeń skałom oraz niezmienioną prędkość maksymalną.

W odrębnym zapisie na porcie 3001 Mira z 19 PD wydobyła i przywiozła 7 rudy. Ekran wyniku pokazał +7 PD, poziom 2 i jeden punkt. Przydzielenie go do ewakuacji zwiększyło szansę kapsuły z 42% do 48%, zużyło punkt i wyłączyło dalszy rozwój. Po ponownym wczytaniu zachowały się 26 PD i umiejętność, a zapasowy Ivo pozostał na poziomie 1. Sprawdzono też poziom 5, pełny pasek PD i blokady umiejętności na poziomie 2. Konsola nie zgłosiła błędów ani ostrzeżeń.

Zrzuty: [awans po wyprawie](screenshots/pilot-promotion-v0.6.jpg), [wybrana umiejętność](screenshots/pilot-training-v0.6.jpg), [limit rozwoju](screenshots/pilot-veteran-v0.6.jpg).
