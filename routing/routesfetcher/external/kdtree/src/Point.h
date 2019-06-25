/**
 * File: Point.h
 * -------------
 * A class representing a point in N-dimensional space.
 * Point is parameterized over an integer N.
 * This allows the compiler to verify the type being used correctly.
 */
#ifndef POINT_INCLUDED
#define POINT_INCLUDED

#include <cmath>
#include <algorithm>
#include <boost/graph/adjacency_list.hpp>
#include <boost/graph/graph_traits.hpp>

const static double EarthRadiusKm = 6372.8;

inline double DegreeToRadian(double angle)
{
    return M_PI * angle / 180.0;
}

template <std::size_t N>
class Point {

public:
    // Types representing iterators that can traverse and optionally modify the elements of the Point.
    typedef double *iterator;
    typedef const double *const_iterator;

    Point() {
        this->lat = 45;
        this->lon = 9;
    }

    template <class Archive>
    void serialize(Archive &ar, const unsigned int version) {
        ar &lat;
        ar &lon;
    }

    // Returns N, the dimension of the point.
    std::size_t size() const;

    // Queries or retrieves the value of the point at a particular point. The index is assumed to be in-range.
    double &operator[](std::size_t index);

    double operator[](std::size_t index) const;

    Point(double lat, double lon) {
        this->lat = lat;
        this->lon = lon;
    }

    // Returns iterators delineating the full range of elements in the Point.
    iterator begin();

    iterator end();

    const_iterator begin() const;

    const_iterator end() const;

    double lat;
    double lon;

};

// Returns the Havesine distance between two points.
template <std::size_t N>
double Distance(const Point<N>& one, const Point<N>& two);

// Returns whether two points are equal / not equal
template <std::size_t N>
bool operator==(const Point<N>& one, const Point<N>& two);

template <std::size_t N>
bool operator!=(const Point<N>& one, const Point<N>& two);

template <std::size_t N>
std::size_t Point<N>::size() const {
    return N;
}

template <std::size_t N>
double& Point<N>::operator[] (std::size_t index) {
    if (index == 0)
        return lat;
    else return lon;
}

template <std::size_t N>
double Point<N>::operator[] (std::size_t index) const {
    if (index == 0)
        return lat;
    else return lon;
}

template <std::size_t N>
typename Point<N>::iterator Point<N>::end() {
    return begin() + size();
}

template <std::size_t N>
typename Point<N>::const_iterator Point<N>::end() const {
    return begin() + size();
}

template <std::size_t N>
double Distance(const Point<N>& one, const Point<N>& two) {
    double latRad1 = DegreeToRadian(one[0]);
    double latRad2 = DegreeToRadian(two[0]);
    double lonRad1 = DegreeToRadian(one[1]);
    double lonRad2 = DegreeToRadian(two[1]);

    double diffLa = latRad2 - latRad1;
    double doffLo = lonRad2 - lonRad1;

    double computation = asin(sqrt(sin(diffLa / 2) * sin(diffLa / 2) + cos(latRad1) * cos(latRad2) * sin(doffLo / 2) * sin(doffLo / 2)));
    return 2 * EarthRadiusKm * computation;
}

template <std::size_t N>
bool operator==(const Point<N>& one, const Point<N>& two) {
    return std::equal(one.begin(), one.end(), two.begin());
}

template <std::size_t N>
bool operator!=(const Point<N>& one, const Point<N>& two) {
    return !(one == two);
}

#endif // POINT_INCLUDED
