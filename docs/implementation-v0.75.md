# Wersja 0.75 — odzysk sondy ze skażonej anomalii

Data: 2026-10-18. Format kampanii 47 i dziennika 21. Starsze zapisy są odrzucane, bez migracji.

## Pierwsza misja w skażonym terenie

Po pierwszym zwiadzie przy Jowiszu dostępne jest dodatkowe zadanie „Sonda w skażonej anomalii”. Wybiera się je w stacji jako cel wyprawy. Nie blokuje głównej kampanii ani podróży do Saturna. Odprawa radiowa opisuje ryzyko i sterowanie, bez przesądzania dalszej fabuły anomalii.

Ta wyprawa zawiera pięć nieregularnych, fioletowych pasm skażenia. Pomiędzy nimi biegną szerokie, bezpieczne korytarze oznaczone punktami 3, 4 i 5 oraz turkusową linią punktową. N wskazuje sondę i stanowi bezpośredni kierunek do celu, nie automatyczny bezpieczny kurs. Skrót przez skażone pasma jest możliwy kosztem osłon i kadłuba.

Po kontakcie pełnej bryły statku z pasmem HUD ostrzega o skażeniu. Po 0,8 s nieprzerwanej ekspozycji naliczają się obrażenia: 10/s, w impulsach po 5 co pół sekundy. Korzystają z istniejącej ochrony i tarczy; nie dają odporności na śmiertelne obrażenia. Wyjście do korytarza kończy ekspozycję i zatrzymuje dalsze naliczanie. Sprawdzany jest odcinek przebytej drogi, również przy szybkim przemieszczeniu pomiędzy klatkami.

## Fizyczny odzysk

Sonda ma osobny wygląd, fizyczne ciało i hol. Jej własna osłona pomiarowa chroni ją przed skażeniem; nadal może zostać zniszczona przez zwykłe zagrożenia. Nie wymaga minigry naprawy promu. Podejście poniżej 60 m/s i przytrzymanie E przez 3 s podłącza linę. Zajęty hol lub obrażenia przerywają podłączanie. J odłącza tę samą sondę, pozostawiając ją w świecie.

Samo dotarcie do sondy ani podłączenie holu nie zalicza zadania. Sonda musi fizycznie wejść w obszar dostawy przy Satuk 15. Wówczas radio potwierdza cel i wypłaca jednorazowo 32 rudy i 10 komponentów. Dokowanie staje się dostępne, a dostawa pozostaje potwierdzona po ewentualnej późniejszej stracie statku. Po zniszczeniu sondy można zarządzić odwrót i rozpocząć nową próbę, bez nagrody za nieudany odzysk.

Losowe skały są odsunięte od całego labiryntu, aby nie zablokować korytarza ani miejsca podjęcia sondy. Pozostałe cele i przeciwnicy Jowisza pozostają dostępni.

## Zakres i ograniczenia

Jest to pierwsza, przygotowana misja z nowym rodzajem zagrożenia. Labirynt powstaje w wyprawie wybranej jako odzysk sondy; nie dodaje skażenia do wszystkich swobodnych lotów ani pozostałych sektorów. Pierwszy układ jest stały, aby dało się ocenić czytelność, trasę i balans. Nie wprowadza losowania labiryntów, specjalnej odporności kadłubów ani nowej interpretacji pochodzenia anomalii.

## Weryfikacja

**508/508 testów**, typecheck, lint i build przechodzą. Sześć nowych testów obejmuje geometrię i szerokość korytarzy, kontakt z obrysem statku, ostrzeganie i tempo obrażeń przy różnych krokach, przejście pomiędzy klatkami, dostępność zadania i sondy, rzeczywiste obrażenia oraz śmierć, pełny lot podstawowym Prospectorem przez labirynt z fizycznym odholowaniem i jednorazową nagrodą, a także odłączenie i utratę sondy.

W przeglądarce sprawdzono wybór zadania w stacji, odprawę i wznowienie lotu, pasma, oznaczenia korytarzy, wygląd sondy, HUD oraz klawisz 5. Konsola bez błędów i ostrzeżeń. Użyto osobnego zapisu QA z przygotowanym Jowiszem i startem przy labiryncie; pełny lot od stacji i z powrotem jest testem symulacji, nie ręcznym przejściem w przeglądarce. Podgląd QA nie trafia do końcowego buildu.

## Dalej

Przegląd nowych paczek w `asteroids-sounds` i dobór zamienników dla istniejących zdarzeń. Dalsza rozbudowa anomalii: różne układy korytarzy, nowe cele odzysku i balans osłon, po sprawdzeniu tej pierwszej misji w grze.
