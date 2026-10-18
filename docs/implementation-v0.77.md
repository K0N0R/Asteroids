# Oprawa geometryczna — 0.77

Pierwszy szeroki pakiet liftingu inspirowanego przekazanymi referencjami Kurzgesagt: granatowo-fioletowy kosmos, duże płaskie plamy koloru, pastelowe materiały i czytelne akcenty. Wszystkie ilustracje powstają w Pixi; bez nowych zewnętrznych grafik i fontów.

## Zakres

- Wspólna paleta semantyczna, zaokrąglone panele i przyciski, ciemny tekst na miętowych akcjach oraz font Trebuchet MS. Mniejsze powiększenie przycisków przy najechaniu ogranicza nachodzenie na sąsiednie elementy.
- Nowe ilustracje Ziemi, Księżyca, Merkurego, Wenus, Marsa, Jowisza, Saturna, Urana, Neptuna, Plutona i pasa asteroid. Kontynenty, chmury i pasma są przycinane do globów. Pierścienie, Wielka Czerwona Plama, polarny lód i jasny obszar Plutona różnicują sektory.
- Spokojniejsze tło: trzy szerokie mgławice i 260 gwiazd zamiast 1000. Planeta ma osobne położenie i przygaszenie podczas lotu, poza górnym radarem. Statyczna ilustracja jest składana do tekstury przed przygaszeniem, aby uniknąć prześwitujących krawędzi triangulacji.
- Nowa geometryczna Satuk 15: pierścień, osiem modułów, szprychy, centralne okno i prowadnice doku. Poziom stacji nadal wyróżnia aktywne moduły.
- Pastelowe palety wszystkich czternastu kadłubów i uproszczone wizjery. Zachowane wcześniej dopracowane sylwetki, rozmieszczenie wyposażenia i kształty ulepszeń pancerza.
- Asteroidy z szerokimi kraterami i widocznymi skupiskami rudy zamiast drobnych linii; spokojniejsze barwy powierzchni Księżyca.
- Ciemne podkłady HUD pod stanem statku, zadaniami, komunikatami i sterowaniem. Wspólna oprawa ustawień i kart lobby.

Geometria kolizji, wartości bojowe, ekonomia i format zapisu pozostają bez zmian: kampania 47, dziennik 21.

## Weryfikacja

- Pełny zestaw regresji: 514/514 testów.
- Typecheck, ESLint i kompilacja produkcyjna.
- Podgląd w przeglądarce: dowodzenie przy Ziemi, hangar Prospectora, stacja, odprawa instruktora i HUD podczas lotu. Osobny atlas kontrolny wszystkich jedenastu ilustracji sektorów; przygotowany profil QA używa osobnych kluczy zapisu.
- Kontrola bazowej palety: tekst na panelu około 13,4:1, tekst pomocniczy 8,2:1, najciemniejszy z akcentów informacyjnych 6,4:1. Są to wartości samych kolorów, nie audyt wszystkich półprzezroczystych ekranów.

## Dalsza oprawa

To wspólna podstawa wizualna, a nie zakończenie przerysowania każdego obiektu. Kolejny pakiet: przeciwnicy i ich bazy, instalacje misji, portrety i fryzury pilotów oraz efekty broni i eksplozji. Następnie powierzchnie pozostałych planet i animacje dokowania oraz wylotu. Utrzymać czytelność sojusznik/wróg, rodzajów rud i zagrożeń na tle nowych kolorów.
