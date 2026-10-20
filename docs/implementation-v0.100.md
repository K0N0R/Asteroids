# Wdrożenie 0.100 — animacja wypowiedzi

Odprawy w bazie i radiowe raporty w locie korzystają z jednej animacji literka po literce. Typowe tempo wynosi około 36 znaków na sekundę, z dłuższymi pauzami po przecinkach i końcu zdania. Cichy puls wykorzystuje istniejący fizyczny dźwięk collect przy głośności 0,025, ograniczony do najwyżej jednego wyzwolenia na 100 ms oraz istniejącego limitu głosów. Respektuje przełączniki i głośność efektów. Spacje oraz interpunkcja nie wyzwalają pulsu.

Enter, Spacja i Pokaż całość odsłaniają resztę wypowiedzi bez serii dźwięków. Dopiero kolejne naciśnięcie przechodzi do następnej kwestii lub zamyka odprawę. Przytrzymanie klawisza nie przewija kolejnych kwestii. Pełne zdanie jest dzielone na wiersze przed animacją, więc wyrazy nie przeskakują podczas pisania. Aktualizowany jest tekst istniejącego panelu; grafika portretu i panelu nie jest odtwarzana co literę. Otwarcie ustawień wstrzymuje aktualizację. Długi przestój klatki jest ograniczony do 100 ms animacji i jednego sygnału dźwiękowego.

Przeredagowano wszystkie cztery odprawy Ziemi oraz wybrane raporty w locie: potwierdzenie celów, przybycie na orbitę Księżyca, dostawę Muła, obronę budowy i finał. Wypowiedzi są krótsze, bardziej osobiste i zgodne z bieżącą sekwencją kompletowania paczki na Księżyc. Zniknęły stare instrukcje dotyczące Swifta oraz rozbudowy już ukończonego zaplecza.

Weryfikacja: 12 celowanych testów animacji, pauz i ograniczenia przestojów, obsługi świeżego naciśnięcia, wyciszenia/głośności/ograniczania dźwięku, odpraw po raportach, powtórki bez nagród oraz aktualnego pierwszego zaopatrzenia. Dostosowano stare scenariusze testowe do ukończenia zaplecza w pierwszym zadaniu i fizycznego przybycia na orbitę Księżyca. W osobnej przeglądarce sprawdzono częściowy tekst, odsłonięcie przyciskiem, przejście Enterem i zmianę rozmówcy. Typecheck, lint i build; bez pełnej regresji.

Aplikacja 0.100.0. Kampania 65, dziennik 29 bez zmian. Animacja nie zapisuje nowych pól i nie zmienia postępu misji.
