# Wdrożenie 0.102 — piloci i specjalizacje

Wyodrębniono widok pilotów z dużego LobbyView do ui/pilots.ts. Po lewej są karty kandydatów lub lista maksymalnie ośmiu pilotów. Po prawej: portret, tożsamość, specjalizacja, PD i pasek awansu, opis perku oraz konkretne parametry lub rozwój umiejętności. Usunięto duży pusty podgląd i lakoniczne, podobne do siebie premie obrotu.

Nabór pokazuje każdemu kandydatowi portret i specjalizację, a w szczegółach obrót/hamowanie, wydobycie, tempo skanowania oraz premię kapsuły. Koszt pokazuje stan żelaza / 12. Akcja podaje konkretny brak żelaza, pełną załogę albo blokadę podczas wyprawy. Po zatrudnieniu wybrany jest dokładnie zatrudniony pilot. Kapsuły nadal rezerwują miejsca i są wyjaśnione, gdy występują.

Nawigacja: obrót ×1,20, hamowanie ×1,10. Eksploatacja złóż: moc wydobycia ×1,20, hamowanie ×1,20. Zwiad: postęp zwykłych skanów ×1,35 i premia szansy kapsuły +20 punktów procentowych. Skanowanie nie przyspiesza hakowania ani minigier terminali. Kadet pozostaje bez premii specjalizacji. Szkolenie manewrów wzrosło z 3% do 6%, wydobycia z 5% do 10% na poziom. Premie wydobycia i manewrów mnożą bazową specjalizację. Szkolenie ewakuacji zachowuje 6 p.p. na poziom.

Rozwój pokazuje aktualny wynik i wynik po wydaniu jednego punktu. Szansa kapsuły uwzględnia wybrany statek, pancerz i limit 85%; nie sugeruje wzrostu ponad limit. Widoczne są rangi, dostępne punkty, maksymalny poziom oraz wybór aktywnego pilota. Nie zmieniono liczby poziomów, punktów ani kosztu zatrudnienia.

Włosy, tylne warstwy i słuchawka dopasowują szerokość do wspólnych proporcji danego obrysu głowy. Wygładzono zaczesaną fryzurę: nie ma dawnego ostrego, odstającego narożnika. Mira ma jasny odcień skóry. Generyczny rozkład odcieni ma większy udział jaśniejszych tonów, wszystkie osiem tonów pozostaje dostępne, a kandydaci jednej trójki mają różne odcienie. Ważony wybór jest deterministyczny, bez ponownego losowania po wczytaniu. Portrety fabularne pozostają jawnie ustalone.

Weryfikacja: 15 celowanych testów pilotów i portretów, w tym rzeczywiste wydobycie, hamowanie i skanowanie w symulacji Rapier, przerywanie skanu, szkolenie i limity, zapis/wczytanie, zachowanie specjalizacji, ważony rozkład odcieni oraz granice fryzur dla wszystkich obrysów głowy. W przeglądarce sprawdzono wydanie punktu, zmianę parametrów, wybór kandydata i zatrudnienie do załogi. Kontrola typów, lint i release build; bez pełnej regresji.

Aplikacja 0.102.0. Kampania 65 i dziennik 29 bez zmian: premie są wyliczane, nie dodano pól trwałego zapisu.
