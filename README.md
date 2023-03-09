# Serendipity Project

**ser·en·dip·i·ty**
_/ˌserənˈdipədē/_ (n.)
a fortunate discovery or development by happenstance

**Author's Note**: This project is in its infancy. This document reflects my
_aspirations_ for the project and not its current functionality. If you have
stumbled upon this text somewhere out in the internet, you can always find the
current status on the project's [repository][repo] in
[the CONTRIBUTING.md file][contributing].

Serendipity is a highly extensible programming system that combines the best
elements of many different programming paradigms and philosophies. The visual
editor, [Camino][camino] provides an intuitive and novice-friendly environment
to build and test programs in the browser, then deploy them to the cloud or
other kinds of "agents."

## Why Build Another Editor?

There are numerous novice-friendly programming platforms, but none that offer
all of the features that serendipity aims to deliver. In particular, it is
inspired by projects such as [Microsoft MakeCode][makecode], [MIT
Scratch][scratch], [MIT AppInventor][ai2], and [Snap!][snap].

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
  applications from a single interface.

- functional programming. Existing visual programming languages (particularly
  blocks-based frameworks) made design decisions that leave them broadly
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
[CONTRIBUTING.md][contributing].

## Prior Art

In addition to the other platforms mentioned above in the "Why" section, all of
which have been influential to the design of Serendipity, this project follows
from research conducted in the Laboratory for Plaful Computation at the
University of Colorado Boulder between 2017 and 2019 by Will Temple (me) and
several collaborators. My work on [BlockyTalky 3][bt3] influenced how I
eventually chose to build the Serendipity runtimes and agents.

Some of Serendipity's language and editor features are inspired in part by
[Racket][racket] (graduated language levels/multiple front-ends, debugger) and [Hazel][hazel]
(direct structure editing).

[//]: # "Internal Links"
[contributing]: https://github.com/willmtemple/serendipity/tree/master/CONTRIBUTING.md
[design]: https://github.com/willmtemple/serendipity/tree/master/DESIGN.md
[repo]: https://github.com/willmtemple/serendipity
[//]: # "External Projects"
[bt3]: https://playfulcomputation.group/blockytalky
[makecode]: https://www.microsoft.com/makecode
[ai2]: https://appinventor.mit.edu/
[scratch]: https://scratch.mit.edu/
[snap]: https://snap.berkeley.edu/
[racket]: https://racket-lang.org
[hazel]: https://hazel.org
