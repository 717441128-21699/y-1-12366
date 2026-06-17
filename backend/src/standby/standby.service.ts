import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateDistance } from '../common/utils/geo.util';

export interface CreateStandbyDto {
  userId: number;
  area: string;
  skills: string[];
  currentLat?: number;
  currentLng?: number;
}

export interface UpdateStandbyDto {
  area?: string;
  skills?: string[];
  currentLat?: number;
  currentLng?: number;
  isAvailable?: boolean;
}

export interface NearbyStandbyQuery {
  lat: number;
  lng: number;
  skills?: string[];
  radius?: number;
  limit?: number;
}

@Injectable()
export class StandbyService {
  constructor(private prisma: PrismaService) {}

  async create(createStandbyDto: CreateStandbyDto) {
    return this.prisma.standbyPersonnel.create({
      data: {
        userId: createStandbyDto.userId,
        area: createStandbyDto.area,
        skills: createStandbyDto.skills,
        currentLat: createStandbyDto.currentLat,
        currentLng: createStandbyDto.currentLng,
      },
      include: { user: true },
    });
  }

  async findAll(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.standbyPersonnel.findMany({
        skip,
        take: pageSize,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.standbyPersonnel.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    return this.prisma.standbyPersonnel.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.standbyPersonnel.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async update(id: number, updateStandbyDto: UpdateStandbyDto) {
    return this.prisma.standbyPersonnel.update({
      where: { id },
      data: {
        ...updateStandbyDto,
        lastActive: new Date(),
      },
      include: { user: true },
    });
  }

  async remove(id: number) {
    return this.prisma.standbyPersonnel.delete({
      where: { id },
    });
  }

  async updateLocation(id: number, lat: number, lng: number) {
    return this.prisma.standbyPersonnel.update({
      where: { id },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastActive: new Date(),
      },
      include: { user: true },
    });
  }

  async setAvailability(id: number, isAvailable: boolean) {
    return this.prisma.standbyPersonnel.update({
      where: { id },
      data: {
        isAvailable,
        lastActive: new Date(),
      },
      include: { user: true },
    });
  }

  async findNearby(query: NearbyStandbyQuery) {
    const { lat, lng, skills = [], radius = 50, limit = 10 } = query;

    const allAvailable = await this.prisma.standbyPersonnel.findMany({
      where: {
        isAvailable: true,
      },
      include: { user: true },
    });

    const withDistance = allAvailable
      .filter((s) => s.currentLat != null && s.currentLng != null)
      .map((s) => {
        const distance = calculateDistance(
          lat,
          lng,
          s.currentLat!,
          s.currentLng!,
        );
        const hasAllSkills = skills.length === 0 ||
          skills.some((skill) => s.skills.includes(skill));
        return { ...s, distance, hasMatchingSkill: hasAllSkills };
      })
      .filter((s) => s.distance <= radius);

    withDistance.sort((a, b) => {
      if (a.hasMatchingSkill !== b.hasMatchingSkill) {
        return a.hasMatchingSkill ? -1 : 1;
      }
      return a.distance - b.distance;
    });

    return withDistance.slice(0, limit);
  }

  async findNearestWithSkills(
    lat: number,
    lng: number,
    skills: string[],
    priority: string,
  ) {
    const nearby = await this.findNearby({
      lat,
      lng,
      skills,
      radius: 100,
      limit: 20,
    });

    if (nearby.length === 0) {
      return null;
    }

    return nearby[0];
  }
}
