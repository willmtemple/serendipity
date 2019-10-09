# Serendipity Project

**ser·en·dip·i·ty**
_/ˌserənˈdipədē/_ (n.)
a fortunate discovery or development by happenstance

Serendipity is a highly extensible programming system that combines the best
elements of many different programming paradigms and philosophies. Our visual
editor, [Camino](/willmtemple/serendipity/tree/master/editor/camino/)
provides an intuitive and novice-friendly environment to build and test
programs in the browser, then deploy them to the cloud or other kinds of
"agents."

## Why Build Another Editor?

There are numerous novice-friendly programming platforms, but none that offer
all of the features that serendipity aims to deliver. In particular, we draw
inspiration from projects such as
[Microsoft MakeCode](https://www.microsoft.com/en-us/makecode),
[MIT Scratch](https://scratch.mit.edu/),
[MIT AppInventor](https://appinventor.mit.edu), and
[Snap!](https://snap.berkeley.edu).

Compared to these platforms, Serendipity is designed for:

- ease of use, yet expansiveness in enabling its users to address complex
  problems. In short, it is not a toy. It is a platform that its users can grow
  into, rather than out of.

- flexibility. It can coherently express computations that execute on a wide
  variety of agents by following good, idiomatic standards in its language
  design.

- extensibility and specializability. It is easy to extend, modify, and tweak
  to provide custom behavior without sacrificing interoperability.

- integration. It can instrument and interact with numerous open-source
  services and devices with known APIs.

- modern workflows. A user can develop, build, test, and deploy
  applications&mdash;all in the cloud&mdash;from their browser.

- functional programming. Existing visual programming languages (particularly
  blocks-based frameworks) made design decisions that make them broadly
  incompatible with advanced functional programming. Serendipity is designed
  for functional designs first without sacrificing the ability to represent
  stateful and procedural components elegantly.

- social development. It emphasizes creation, remixing, and sharing. Users
  can develop collaboratively in teams on the same programs and projects, then
  share those creations with the world.

- privacy and control. It is private and secure by default, allowing users to
  retain control of their data. As much of the data as possible is processed on
  a device the user owns, and users can easily determine which parts of their
  data are transmitted to third parties.

## Development

Serendipity is written in TypeScript. This is a monorepo containing all of
Serendipity's many packages. You need [Rush](https://rushjs.io)
(`npm install -g @microsoft/rush` or similar) to build the repository.

To install all dependencies and link inter-dependent packages within the repo:

```
$ rush update
```

Then, build the whole repository:

```
$ rush build
```

For information about contributing to Serendipity, see
[CONTRIBUTING.md](willmtemple/serendipity/tree/master/CONTRIBUTING.md).

## Prior Art

In addition to the other platforms mentioned above in the "Why" section, all
of which have been influential to the design of Serendipity, this project
follows from research conducted in the Laboratory for Plaful Computation at
the University of Colorado Boulder between 2017 and 2019 by Will Temple (me)
and several collaborators. My work on [BlockyTalky
3](https://playfulcomputation.group/blockytalky) influenced how I eventually
chose to build the Serendipity runtimes and agents.

Some of Serendipity's language and editor features are inspired in part by
[Racket](https://racket-lang.org) (graduated language levels, debugger) and
[Hazel](https://hazel.org) (direct structure editing, partial computation).

## License

This section is a summary and shall not be taken as a waiver of any provision
of the full text of the licenses found in each package's `LICENSE` file.

In general, we release our code under variations of the GNU GPLv3 or under
the MIT license. Core libraries and plugins are generally licensed under the
LGPL, command-line utilities such as `slipr` are licensed under the GPL, web
application components such as Camino and the user portal are licensed under
the AGPL, and miscellaneous utilities and scripts are licensed under the MIT
license. Commercial plugins and extensions may be licensed under the Business
Source License, but are free to use for non-commercial purposes.

Compilers and editors have specific license exceptions for code authored by
end-users, so that authors of software using our tools are not encumbered by
our licensing decisions. See the LICENSE files for exact details.
